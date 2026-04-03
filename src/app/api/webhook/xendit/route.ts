import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function verifyWebhookToken(req: NextRequest): boolean {
  const token = req.headers.get("x-callback-token");
  return token === process.env.XENDIT_WEBHOOK_TOKEN;
}

export async function POST(req: NextRequest) {
  if (!verifyWebhookToken(req)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await req.json();
  const event = body.event as string;

  console.log(`[Xendit Webhook] ${event}`);

  try {
    switch (event) {
      case "recurring.plan.activated": {
        const planId = body.data?.id;
        const metadata = body.data?.metadata;

        if (planId) {
          const maxMembers = parseInt(metadata?.maxMembers || "1", 10);

          await prisma.subscription.updateMany({
            where: { xenditPlanId: planId },
            data: {
              status: "ACTIVE",
              maxMembers,
              currentPeriodStart: new Date(),
              currentPeriodEnd: getNextYear(),
            },
          });

          if (metadata?.userId && metadata?.planType !== "SOLO") {
            await prisma.user.update({
              where: { id: metadata.userId },
              data: { role: "ORG_ADMIN" },
            });
          }
        }
        break;
      }

      case "recurring.plan.inactivated": {
        const planId = body.data?.id;
        if (planId) {
          await prisma.subscription.updateMany({
            where: { xenditPlanId: planId },
            data: { status: "CANCELED" },
          });
        }
        break;
      }

      case "recurring.cycle.succeeded": {
        const planId = body.data?.plan_id;
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
        const planId = body.data?.plan_id;
        if (planId) {
          await prisma.subscription.updateMany({
            where: { xenditPlanId: planId },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }

      case "recurring.cycle.failed": {
        const planId = body.data?.plan_id;
        if (planId) {
          await prisma.subscription.updateMany({
            where: { xenditPlanId: planId },
            data: { status: "EXPIRED" },
          });
        }
        break;
      }
    }
  } catch (error) {
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