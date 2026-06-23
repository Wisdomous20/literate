import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { xenditWebhookSchema } from "@/lib/validation/subscription";
import {
  createXenditWebhookDeliveryId,
  verifyXenditWebhookToken,
} from "@/lib/xenditWebhookSecurity";
import {
  claimXenditWebhookDelivery,
  completeXenditWebhookDelivery,
  releaseXenditWebhookDelivery,
} from "@/service/subscription/xenditWebhookDeliveryService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!verifyXenditWebhookToken(req.headers.get("x-callback-token"))) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let body: unknown;
  let rawBody: string;
  try {
    rawBody = await req.text();
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validationResult = xenditWebhookSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const payload = validationResult.data;
  const event = payload.event;
  const deliveryId = createXenditWebhookDeliveryId(rawBody);

  try {
    const claimResult = await claimXenditWebhookDelivery(deliveryId, event);
    if (claimResult === "duplicate") {
      return NextResponse.json({ received: true, duplicate: true });
    }
  } catch (error) {
    console.error("[Xendit Webhook] Delivery claim failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  console.log(`[Xendit Webhook] ${event}`);

  try {
    switch (event) {
      case "recurring.plan.activated": {
        const planId = payload.data.id;
        const metadata = payload.data.metadata;

        if (planId) {
          const requestedMaxMembers = Number(metadata?.maxMembers);
          const maxMembers =
            Number.isSafeInteger(requestedMaxMembers) && requestedMaxMembers > 0
              ? requestedMaxMembers
              : 1;
          const userId = metadata?.userId;
          const planType = metadata?.planType;

          // Activate the subscription
          await prisma.subscription.updateMany({
            where: { xenditPlanId: planId },
            data: {
              status: "ACTIVE",
              maxMembers,
              currentPeriodStart: new Date(),
              currentPeriodEnd: getNextYear(),
            },
          });

          // If it's an org plan, auto-create the organization
          if (userId && planType && planType !== "SOLO") {
            // Upgrade user role
            await prisma.user.update({
              where: { id: userId },
              data: { role: "ORG_ADMIN" },
            });

            // Check if user already has an org
            const existingOrg = await prisma.organization.findFirst({
              where: { ownerId: userId },
            });

            if (!existingOrg) {
              // Get user info for org name
              const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true },
              });

              const orgName = `${user?.firstName || "My"}'s Organization`;

              // Create org + membership + link subscription in a transaction
              await prisma.$transaction(async (tx) => {
                const org = await tx.organization.create({
                  data: {
                    name: orgName,
                    ownerId: userId,
                  },
                });

                // Add owner as a member
                await tx.organizationMember.create({
                  data: {
                    userId: userId,
                    organizationId: org.id,
                  },
                });

                // Link the subscription to the org
                await tx.subscription.updateMany({
                  where: { xenditPlanId: planId },
                  data: { organizationId: org.id },
                });
              });
            } else {
              // Org already exists, just link the subscription
              await prisma.subscription.updateMany({
                where: { xenditPlanId: planId },
                data: { organizationId: existingOrg.id },
              });
            }
          }
        }
        break;
      }

      case "recurring.plan.inactivated": {
        const planId = payload.data.id;
        if (planId) {
          // Preserve ACTIVE until the paid period ends when the user explicitly
          // stopped renewal (e.g. accepted an org invite). The natural expiry
          // is enforced at read time via currentPeriodEnd.
          await prisma.subscription.updateMany({
            where: { xenditPlanId: planId, cancelAtPeriodEnd: false },
            data: { status: "CANCELED" },
          });
        }
        break;
      }

      case "recurring.cycle.succeeded": {
        const planId = payload.data.plan_id;
        if (planId) {
          await prisma.subscription.updateMany({
            where: { xenditPlanId: planId },
            data: {
              status: "ACTIVE",
              currentPeriodStart: new Date(),
              currentPeriodEnd: getNextYear(),
            },
          });
        }
        break;
      }

      case "recurring.cycle.retrying": {
        const planId = payload.data.plan_id;
        if (planId) {
          await prisma.subscription.updateMany({
            where: { xenditPlanId: planId },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }

      case "recurring.cycle.failed": {
        const planId = payload.data.plan_id;
        if (planId) {
          await prisma.subscription.updateMany({
            where: { xenditPlanId: planId },
            data: { status: "EXPIRED" },
          });
        }
        break;
      }
    }

    await completeXenditWebhookDelivery(deliveryId);
  } catch (error) {
    await releaseXenditWebhookDelivery(deliveryId).catch(() => undefined);
    console.error("[Xendit Webhook] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function getNextYear(): Date {
  const next = new Date();
  next.setFullYear(next.getFullYear() + 1);
  return next;
}
