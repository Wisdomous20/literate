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
import { createInvoiceAndSendEmail } from "@/service/subscription/invoiceService";

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
          const updatedSubscription = await prisma.subscription.update({
            where: { xenditPlanId: planId },
            data: {
              status: "ACTIVE",
              maxMembersSnapshot: maxMembers,
              currentPeriodStart: new Date(),
              currentPeriodEnd: getNextYear(),
            },
          });

          await createInvoiceAndSendEmail({
            subscriptionId: updatedSubscription.id,
            providerInvoiceId: createProviderInvoiceId(event, planId),
            providerPaymentId: getPayloadId(payload.data),
            providerPayload: payload.data,
          });
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
          const updatedSubscription = await prisma.subscription.update({
            where: { xenditPlanId: planId },
            data: {
              status: "ACTIVE",
              currentPeriodStart: new Date(),
              currentPeriodEnd: getNextYear(),
            },
          });

          await createInvoiceAndSendEmail({
            subscriptionId: updatedSubscription.id,
            providerInvoiceId: createProviderInvoiceId(event, planId),
            providerPaymentId: getPayloadId(payload.data),
            providerPayload: payload.data,
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

function createProviderInvoiceId(event: string, planId: string): string {
  const datePart = new Date().toISOString().slice(0, 10);
  return `xendit:${event}:${planId}:${datePart}`;
}

function getPayloadId(data: unknown): string | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    typeof data.id === "string"
  ) {
    return data.id;
  }

  return null;
}
