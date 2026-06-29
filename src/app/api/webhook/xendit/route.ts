import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { xenditRequest } from "@/lib/xendit";
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
      case "payment_session.completed":
      case "payment_session.succeeded": {
        const paymentSessionId =
          payload.data.payment_session_id ??
          payload.data.id ??
          payload.data.reference_id ??
          payload.data.metadata?.checkoutReferenceId;
        const metadata = payload.data.metadata;

        if (paymentSessionId) {
          const requestedMaxMembers = Number(metadata?.maxMembers);
          const maxMembers =
            Number.isSafeInteger(requestedMaxMembers) && requestedMaxMembers > 0
              ? requestedMaxMembers
              : 1;
          const isPlanChange = metadata?.planChange === "true";
          const previousXenditPlanId =
            typeof metadata?.previousXenditPlanId === "string"
              ? metadata.previousXenditPlanId
              : null;
          const organizationId =
            typeof metadata?.organizationId === "string"
              ? metadata.organizationId
              : null;
          const planId =
            typeof metadata?.planId === "string" ? metadata.planId : null;

          const updatedSubscription = await prisma.$transaction(async (tx) => {
            const target = await findPendingSubscriptionForPaymentSession(tx, {
              paymentSessionId,
              organizationId,
              planId,
            });

            if (!target) {
              throw new Error(
                `Pending subscription not found for payment session ${paymentSessionId}`,
              );
            }

            const updated = await tx.subscription.update({
              where: { id: target.id },
              data: {
                status: "ACTIVE",
                xenditPlanId: paymentSessionId,
                maxMembersSnapshot: maxMembers,
                currentPeriodStart: new Date(),
                currentPeriodEnd: getNextYear(),
              },
            });

            if (isPlanChange && previousXenditPlanId) {
              await tx.subscription.updateMany({
                where: {
                  xenditPlanId: previousXenditPlanId,
                  status: { in: ["ACTIVE", "PAST_DUE"] },
                },
                data: { status: "SUPERSEDED" },
              });
            }

            await tx.organization.update({
              where: { id: updated.organizationId },
              data: { currentSubscriptionId: updated.id },
            });

            return updated;
          });

          await createInvoiceAndSendEmail({
            subscriptionId: updatedSubscription.id,
            providerInvoiceId: createProviderInvoiceId(event, paymentSessionId),
            providerPaymentId: getPayloadId(payload.data),
            providerPayload: payload.data,
            ...(isPlanChange
              ? {
                  subtotalAmount: parseMetadataAmount(metadata?.subtotalAmount),
                  discountAmount: parseMetadataAmount(metadata?.discountAmount),
                  totalAmount: parseMetadataAmount(metadata?.totalAmount),
                }
              : {}),
          });
        }
        break;
      }

      case "recurring.plan.activated":
      case "recurring.plan.activation": {
        const planId = payload.data.id;
        const metadata = payload.data.metadata;

        if (planId) {
          const requestedMaxMembers = Number(metadata?.maxMembers);
          const maxMembers =
            Number.isSafeInteger(requestedMaxMembers) && requestedMaxMembers > 0
              ? requestedMaxMembers
              : 1;

          const isPlanChange = metadata?.planChange === "true";
          const previousXenditPlanId =
            typeof metadata?.previousXenditPlanId === "string"
              ? metadata.previousXenditPlanId
              : null;

          // Activate the new row, supersede the old one, and repoint the org's
          // current-subscription pointer in a single transaction so "the org's
          // active subscription" is never ambiguous mid-swap.
          const updatedSubscription = await prisma.$transaction(async (tx) => {
            const updated = await tx.subscription.update({
              where: { xenditPlanId: planId },
              data: {
                status: "ACTIVE",
                maxMembersSnapshot: maxMembers,
                currentPeriodStart: new Date(),
                currentPeriodEnd: getNextYear(),
              },
            });

            if (isPlanChange && previousXenditPlanId) {
              await tx.subscription.updateMany({
                where: {
                  xenditPlanId: previousXenditPlanId,
                  status: { in: ["ACTIVE", "PAST_DUE"] },
                },
                data: { status: "SUPERSEDED" },
              });
            }

            // Point the org at the newly active subscription (covers both the
            // first activation for a new org and the post-change swap).
            await tx.organization.update({
              where: { id: updated.organizationId },
              data: { currentSubscriptionId: updated.id },
            });

            return updated;
          });

          // Stop the old recurring plan from billing again. Idempotent: a replay
          // or an already-inactive plan is harmless.
          if (isPlanChange && previousXenditPlanId) {
            try {
              await xenditRequest(
                `/recurring/plans/${previousXenditPlanId}/deactivate`,
                "POST",
              );
            } catch (error) {
              console.error(
                "[Xendit Webhook] Failed to deactivate superseded plan:",
                error,
              );
            }
          }

          await createInvoiceAndSendEmail({
            subscriptionId: updatedSubscription.id,
            providerInvoiceId: createProviderInvoiceId(event, planId),
            providerPaymentId: getPayloadId(payload.data),
            providerPayload: payload.data,
            ...(isPlanChange
              ? {
                  subtotalAmount: parseMetadataAmount(metadata?.subtotalAmount),
                  discountAmount: parseMetadataAmount(metadata?.discountAmount),
                  totalAmount: parseMetadataAmount(metadata?.totalAmount),
                }
              : {}),
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

async function findPendingSubscriptionForPaymentSession(
  tx: Prisma.TransactionClient,
  input: {
    paymentSessionId: string;
    organizationId: string | null;
    planId: string | null;
  },
) {
  const direct = await tx.subscription.findFirst({
    where: {
      xenditPlanId: input.paymentSessionId,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });

  if (direct) return direct;

  if (!input.organizationId || !input.planId) {
    return null;
  }

  return tx.subscription.findFirst({
    where: {
      organizationId: input.organizationId,
      planId: input.planId,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });
}

function parseMetadataAmount(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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
