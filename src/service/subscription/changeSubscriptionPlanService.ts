import { prisma } from "@/lib/prisma";
import { buildApplicationUrl } from "@/lib/applicationUrl";
import { calculatePrice, getMaxMembers, PLANS, PlanKey } from "@/config/plans";
import { computeProrationCredit, roundCurrency } from "./proration";
import { createXenditSubscriptionSession } from "@/service/subscription/xenditSubscriptionSession";
import { createInvoiceAndSendEmail } from "@/service/subscription/invoiceService";

interface ChangePlanSuccess {
  success: true;
  url: string;
  credit: number;
  newCharge: number;
}

interface ChangePlanFailure {
  success: false;
  error: string;
}

export type ChangePlanResult = ChangePlanSuccess | ChangePlanFailure;

export async function changeSubscriptionPlanService(
  userId: string,
  newPlanType: PlanKey,
  memberCount?: number,
): Promise<ChangePlanResult> {
  if (!["SOLO", "KASALO", "PANALO", "PAMILYA"].includes(newPlanType)) {
    return { success: false, error: "Invalid plan type" };
  }

  if (newPlanType === "PAMILYA" && (!memberCount || memberCount < 20)) {
    return { success: false, error: "Pamilya plan requires at least 20 members" };
  }

  const orgType = newPlanType === "SOLO" ? "PERSONAL" : "TEAM";

  const current = await findCurrentActiveSubscription(userId, orgType);
  if (!current) {
    return { success: false, error: "No active subscription to change" };
  }

  const { organization, subscription, user } = current;

  const fullPrice = calculatePrice(newPlanType, memberCount);
  const maxMembers = getMaxMembers(newPlanType, memberCount);
  const planMaxMembers =
    newPlanType === "PAMILYA" ? PLANS.PAMILYA.minMembers : PLANS[newPlanType].maxMembers;
  const planPriceAmount =
    newPlanType === "PAMILYA"
      ? calculatePrice(newPlanType, PLANS.PAMILYA.minMembers)
      : fullPrice;
  const currency = subscription.currencySnapshot;

  const credit = computeProrationCredit({
    priceAmountSnapshot: Number(subscription.priceAmountSnapshot),
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
  });
  const newCharge = Math.max(0, roundCurrency(fullPrice - credit));

  try {
    const planRecord = await prisma.plan.upsert({
      where: { code: newPlanType },
      create: {
        code: newPlanType,
        name: PLANS[newPlanType].name,
        maxMembers: planMaxMembers,
        priceAmount: planPriceAmount,
        currency,
        billingInterval: "YEAR",
      },
      update: {
        name: PLANS[newPlanType].name,
        maxMembers: planMaxMembers,
        priceAmount: planPriceAmount,
        currency,
        billingInterval: "YEAR",
        active: true,
      },
    });

    if (newCharge <= 0) {
      const newSubscription = await prisma.$transaction(async (tx) => {
        const created = await tx.subscription.create({
          data: {
            organizationId: organization.id,
            planId: planRecord.id,
            status: "ACTIVE",
            maxMembersSnapshot: maxMembers,
            priceAmountSnapshot: fullPrice,
            currencySnapshot: currency,
            xenditCustomerId: subscription.xenditCustomerId,
            currentPeriodStart: new Date(),
            currentPeriodEnd: subscription.currentPeriodEnd ?? getNextYear(),
          },
        });

        await tx.subscription.updateMany({
          where: {
            id: subscription.id,
            status: { in: ["ACTIVE", "PAST_DUE"] },
          },
          data: { status: "SUPERSEDED" },
        });

        await tx.organization.update({
          where: { id: organization.id },
          data: { currentSubscriptionId: created.id },
        });

        return created;
      });

      await createInvoiceAndSendEmail({
        subscriptionId: newSubscription.id,
        providerInvoiceId: `internal:plan-change:${newSubscription.id}`,
        providerPaymentId: null,
        providerPayload: {
          reason: "Proration credit covered the plan change.",
          previousSubscriptionId: subscription.id,
        },
        subtotalAmount: fullPrice,
        discountAmount: credit,
        totalAmount: 0,
      });

      return {
        success: true,
        url: buildApplicationUrl("/dashboard?subscription=success"),
        credit,
        newCharge,
      };
    }

    const session = await createXenditSubscriptionSession({
      userId,
      userName: [user.firstName, user.lastName].filter(Boolean).join(" "),
      userEmail: user.email ?? "",
      organizationId: organization.id,
      xenditCustomerId: subscription.xenditCustomerId,
      amount: newCharge,
      currency,
      anchorDate: subscription.currentPeriodEnd ?? new Date(),
      immediatePayment: false,
      description: `Literate ${newPlanType} Plan - Annual (plan change)`,
      metadata: {
        userId,
        organizationId: organization.id,
        planId: planRecord.id,
        planType: newPlanType,
        maxMembers: String(maxMembers),
        planChange: "true",
        previousSubscriptionId: subscription.id,
        previousXenditPlanId: subscription.xenditPlanId ?? "",
        subtotalAmount: String(fullPrice),
        discountAmount: String(credit),
        totalAmount: String(newCharge),
      },
    });

    await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        planId: planRecord.id,
        status: "PENDING",
        maxMembersSnapshot: maxMembers,
        priceAmountSnapshot: fullPrice,
        currencySnapshot: currency,
        xenditCustomerId: session.customerId,
        xenditPlanId: session.recurringPlanId,
      },
    });

    return { success: true, url: session.paymentLinkUrl, credit, newCharge };
  } catch (error) {
    console.error("Change subscription plan error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to change subscription plan: ${error.message}`
          : "Failed to change subscription plan",
    };
  }
}

async function findCurrentActiveSubscription(
  userId: string,
  orgType: "PERSONAL" | "TEAM",
) {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      role: { in: ["OWNER", "ADMIN"] },
      organization: {
        type: orgType,
        currentSubscription: { is: { status: "ACTIVE" } },
      },
    },
    include: {
      user: true,
      organization: { include: { currentSubscription: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  const subscription = membership?.organization.currentSubscription;
  if (!membership || !subscription) return null;

  return {
    organization: membership.organization,
    subscription,
    user: membership.user,
  };
}

function getNextYear(): Date {
  const next = new Date();
  next.setFullYear(next.getFullYear() + 1);
  return next;
}
