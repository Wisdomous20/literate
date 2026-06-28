import { randomUUID } from "crypto";
import { xenditRequest } from "@/lib/xendit";
import { prisma } from "@/lib/prisma";
import { calculatePrice, getMaxMembers, PLANS, PlanKey } from "@/config/plans";
import { computeProrationCredit, roundCurrency } from "./proration";

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

/**
 * Upgrade/downgrade an organization's plan with proration.
 *
 * Creates a brand-new Subscription row (PENDING) and a brand-new Xendit recurring
 * plan at the FULL new price (anchored to the current renewal boundary so future
 * cycles bill at full price). The unused portion of the current period is credited
 * against an immediate one-time charge of `newCharge` — the discount is NOT baked
 * into the recurring amount, so it never leaks into renewals.
 *
 * The current live subscription is left untouched. The swap (deactivate old Xendit
 * plan, supersede old row, repoint Organization.currentSubscriptionId, create the
 * discounted invoice) is completed by the recurring.plan.activated webhook once the
 * new plan's payment is authorized. An abandoned change leaves the old plan active.
 */
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

  const { organization, subscription } = current;

  const fullPrice = calculatePrice(newPlanType, memberCount);
  const maxMembers = getMaxMembers(newPlanType, memberCount);
  const planMaxMembers =
    newPlanType === "PAMILYA" ? PLANS.PAMILYA.minMembers : PLANS[newPlanType].maxMembers;
  const planPriceAmount =
    newPlanType === "PAMILYA"
      ? calculatePrice(newPlanType, PLANS.PAMILYA.minMembers)
      : fullPrice;
  const currency = subscription.currencySnapshot;

  // Proration credit from the current period (uses the snapshot price, never Plan).
  const credit = computeProrationCredit({
    priceAmountSnapshot: Number(subscription.priceAmountSnapshot),
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
  });
  // Edge case: credit ≥ full price (downgrade or late in a long term) → floor at 0.
  // Any leftover is forfeited and noted on the invoice.
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

    const uniqueId = randomUUID();
    // Anchor renewals to the current period boundary so the FULL price bills then.
    const anchorDate = subscription.currentPeriodEnd ?? new Date();

    const plan = await xenditRequest<{
      id: string;
      actions: { action: string; url: string }[];
    }>("/recurring/plans", "POST", {
      reference_id: `literate-${newPlanType.toLowerCase()}-${organization.id}-${uniqueId}`,
      customer_id: subscription.xenditCustomerId,
      recurring_action: "PAYMENT",
      currency,
      // Recurring cycles bill at the FULL new price — never the discounted amount.
      amount: fullPrice,
      schedule: {
        reference_id: `schedule-${userId}-${uniqueId}`,
        interval: "MONTH",
        interval_count: 12,
        anchor_date: anchorDate.toISOString(),
        retry_interval: "DAY",
        retry_interval_count: 3,
        total_retry: 3,
        failed_attempt_notifications: [1, 3],
      },
      // The prorated amount is charged immediately as a one-time payment below; the
      // recurring plan itself takes no immediate full-amount action. Xendit only
      // accepts FULL_AMOUNT here, so omitting the field is how we say "no immediate
      // recurring charge" — the first full cycle bills at anchor_date.
      notification_config: {
        recurring_created: ["EMAIL"],
        recurring_succeeded: ["EMAIL"],
        recurring_failed: ["EMAIL"],
        locale: "en",
      },
      failed_cycle_action: "STOP",
      success_return_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success`,
      failure_return_url: `${process.env.NEXTAUTH_URL}/pricing?subscription=failed`,
      description: `Literate ${newPlanType} Plan — Annual (plan change)`,
      metadata: {
        userId,
        organizationId: organization.id,
        planId: planRecord.id,
        planType: newPlanType,
        maxMembers: String(maxMembers),
        // Markers the webhook uses to complete the swap and the discounted invoice.
        planChange: "true",
        previousSubscriptionId: subscription.id,
        previousXenditPlanId: subscription.xenditPlanId ?? "",
        subtotalAmount: String(fullPrice),
        discountAmount: String(credit),
        totalAmount: String(newCharge),
      },
    });

    // New row: PENDING, fresh snapshots, its own xenditPlanId. The live row and the
    // org's currentSubscriptionId are intentionally left untouched until activation.
    await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        planId: planRecord.id,
        status: "PENDING",
        maxMembersSnapshot: maxMembers,
        priceAmountSnapshot: fullPrice,
        currencySnapshot: currency,
        xenditCustomerId: subscription.xenditCustomerId,
        xenditPlanId: plan.id,
      },
    });

    const actionUrl = plan.actions?.find((a) => a.action === "AUTH")?.url;
    if (!actionUrl) {
      return { success: false, error: "No action URL returned from Xendit" };
    }

    return { success: true, url: actionUrl, credit, newCharge };
  } catch (error) {
    console.error("Change subscription plan error:", error);
    return { success: false, error: "Failed to change subscription plan" };
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
      organization: { include: { currentSubscription: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  const subscription = membership?.organization.currentSubscription;
  if (!membership || !subscription) return null;

  return { organization: membership.organization, subscription };
}
