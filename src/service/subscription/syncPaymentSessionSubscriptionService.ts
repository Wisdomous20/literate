import { prisma } from "@/lib/prisma";
import { xenditRequest } from "@/lib/xendit";
import { createInvoiceAndSendEmail } from "@/service/subscription/invoiceService";

type PendingSubscription = NonNullable<
  Awaited<ReturnType<typeof findLatestPendingSubscription>>
>;

type XenditPaymentSession = {
  id?: string;
  payment_session_id?: string;
  status?: string;
  payment_status?: string;
  metadata?: Record<string, string | undefined>;
};

export async function syncLatestPendingPaymentSessionSubscription(userId: string) {
  const pending = await findLatestPendingSubscription(userId);
  if (!pending?.xenditPlanId) {
    return { success: true as const, updated: false, reason: "No pending subscription" };
  }

  const session = await xenditRequest<XenditPaymentSession>(
    `/sessions/${pending.xenditPlanId}`,
    "GET",
  );

  if (!isPaidPaymentSession(session)) {
    return {
      success: true as const,
      updated: false,
      reason: `Payment session is ${session.status ?? session.payment_status ?? "not paid"}`,
    };
  }

  const updatedSubscription = await activatePendingSubscription(
    pending,
    session,
  );

  await createInvoiceAndSendEmail({
    subscriptionId: updatedSubscription.id,
    providerInvoiceId: createProviderInvoiceId(
      "payment_session.completed",
      pending.xenditPlanId,
    ),
    providerPaymentId: session.payment_session_id ?? session.id ?? pending.xenditPlanId,
    providerPayload: session,
    ...(session.metadata?.planChange === "true"
      ? {
          subtotalAmount: parseMetadataAmount(session.metadata.subtotalAmount),
          discountAmount: parseMetadataAmount(session.metadata.discountAmount),
          totalAmount: parseMetadataAmount(session.metadata.totalAmount),
        }
      : {}),
  });

  return { success: true as const, updated: true, subscriptionId: updatedSubscription.id };
}

async function findLatestPendingSubscription(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      role: { in: ["OWNER", "ADMIN"] },
      organization: {
        subscriptions: {
          some: {
            status: "PENDING",
            xenditPlanId: { not: null },
          },
        },
      },
    },
    include: {
      organization: {
        include: {
          subscriptions: {
            where: {
              status: "PENDING",
              xenditPlanId: { not: null },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return (
    memberships
      .flatMap((membership) => membership.organization.subscriptions)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null
  );
}

async function activatePendingSubscription(
  pending: PendingSubscription,
  session: XenditPaymentSession,
) {
  const metadata = session.metadata;
  const previousXenditPlanId =
    typeof metadata?.previousXenditPlanId === "string"
      ? metadata.previousXenditPlanId
      : null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id: pending.id },
      data: {
        status: "ACTIVE",
        xenditPlanId: session.payment_session_id ?? session.id ?? pending.xenditPlanId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: getNextYear(),
      },
    });

    if (metadata?.planChange === "true" && previousXenditPlanId) {
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
}

function isPaidPaymentSession(session: XenditPaymentSession) {
  const status = (session.payment_status ?? session.status ?? "").toUpperCase();
  return ["PAID", "SUCCEEDED", "SUCCESS", "COMPLETED", "COMPLETED_SUCCEEDED"].includes(status);
}

function createProviderInvoiceId(event: string, providerId: string): string {
  const datePart = new Date().toISOString().slice(0, 10);
  return `xendit:${event}:${providerId}:${datePart}`;
}

function parseMetadataAmount(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getNextYear(): Date {
  const next = new Date();
  next.setFullYear(next.getFullYear() + 1);
  return next;
}
