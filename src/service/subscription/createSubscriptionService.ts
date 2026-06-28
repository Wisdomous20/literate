import { randomUUID } from "crypto";
import { xenditRequest } from "@/lib/xendit";
import { prisma } from "@/lib/prisma";
import { calculatePrice, getMaxMembers, PLANS, PlanKey } from "@/config/plans";
import { changeSubscriptionPlanService } from "@/service/subscription/changeSubscriptionPlanService";

interface CreateSubscriptionInput {
  userId: string;
  userName: string;
  userEmail: string;
  planType: PlanKey;
  memberCount?: number;
}

export type SubscribeResult =
  | { success: true; url: string; credit?: number; newCharge?: number }
  | { success: false; error: string };

export async function createSubscriptionService(
  input: CreateSubscriptionInput
): Promise<SubscribeResult> {
  const { userId, userName, userEmail } = input;
  const { planType, memberCount } = input;

  if (!["SOLO", "KASALO", "PANALO", "PAMILYA"].includes(planType)) {
    return { success: false, error: "Invalid plan type" };
  }

  if (planType === "PAMILYA" && (!memberCount || memberCount < 20)) {
    return { success: false, error: "Pamilya plan requires at least 20 members" };
  }

  const amount = calculatePrice(planType, memberCount);
  const maxMembers = getMaxMembers(planType, memberCount);
  const planMaxMembers =
    planType === "PAMILYA" ? PLANS.PAMILYA.minMembers : PLANS[planType].maxMembers;
  const planPriceAmount =
    planType === "PAMILYA"
      ? calculatePrice(planType, PLANS.PAMILYA.minMembers)
      : amount;
  const organizationType = planType === "SOLO" ? "PERSONAL" : "TEAM";
  const organizationName =
    organizationType === "PERSONAL"
      ? `${userName || "My"}'s Workspace`
      : `${userName || "My"}'s Organization`;

  try {
    const planRecord = await prisma.plan.upsert({
      where: { code: planType },
      create: {
        code: planType,
        name: PLANS[planType].name,
        maxMembers: planMaxMembers,
        priceAmount: planPriceAmount,
        currency: "PHP",
        billingInterval: "YEAR",
      },
      update: {
        name: PLANS[planType].name,
        maxMembers: planMaxMembers,
        priceAmount: planPriceAmount,
        currency: "PHP",
        billingInterval: "YEAR",
        active: true,
      },
    });

    const organization = await ensureSubscriptionOrganization({
      userId,
      name: organizationName,
      type: organizationType,
    });

    // If the org already has a live plan, this purchase is a tier change — route
    // it through the proration flow instead of overwriting the active row.
    const orgWithCurrent = await prisma.organization.findUnique({
      where: { id: organization.id },
      include: { currentSubscription: true },
    });
    if (orgWithCurrent?.currentSubscription?.status === "ACTIVE") {
      return changeSubscriptionPlanService(userId, planType, memberCount);
    }

    // Reuse an existing Xendit customer from any prior subscription on this org.
    const priorSub = await prisma.subscription.findFirst({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
    });

    let xenditCustomerId = priorSub?.xenditCustomerId;

    // Step 1: Create or retrieve Xendit customer
    if (!xenditCustomerId) {
      try {
        const customer = await xenditRequest<{ id: string }>(
          "/customers",
          "POST",
          {
            reference_id: userId,
            type: "INDIVIDUAL",
            individual_detail: { given_names: userName || "User" },
            email: userEmail,
          }
        );
        xenditCustomerId = customer.id;
      } catch {
        // Customer may already exist from a previous attempt, fetch by reference_id
        const existing = await xenditRequest<{ data: { id: string }[] }>(
          `/customers?reference_id=${userId}`,
          "GET"
        );
        if (existing.data.length > 0) {
          xenditCustomerId = existing.data[0].id;
        } else {
          throw new Error("Failed to create or retrieve Xendit customer");
        }
      }
    }

    const uniqueId = randomUUID();

    // Step 2: Create subscription plan
    const plan = await xenditRequest<{
      id: string;
      status: string;
      actions: { action: string; url: string }[];
    }>("/recurring/plans", "POST", {
      reference_id: `literate-${planType.toLowerCase()}-${organization.id}-${uniqueId}`,
      customer_id: xenditCustomerId,
      recurring_action: "PAYMENT",
      currency: "PHP",
      amount,
      schedule: {
        reference_id: `schedule-${userId}-${uniqueId}`,
        interval: "MONTH",
        interval_count: 12,
        anchor_date: new Date().toISOString(),
        retry_interval: "DAY",
        retry_interval_count: 3,
        total_retry: 3,
        failed_attempt_notifications: [1, 3],
      },
      immediate_action_type: "FULL_AMOUNT",
      notification_config: {
        recurring_created: ["EMAIL"],
        recurring_succeeded: ["EMAIL"],
        recurring_failed: ["EMAIL"],
        locale: "en",
      },
      failed_cycle_action: "STOP",
      success_return_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success`,
      failure_return_url: `${process.env.NEXTAUTH_URL}/pricing?subscription=failed`,
      description: `Literate ${planType} Plan — Annual`,
      metadata: {
        userId,
        organizationId: organization.id,
        planId: planRecord.id,
        planType,
        maxMembers: String(maxMembers),
      },
    });

    // Step 3: Save subscription record. A brand-new period is always its own row;
    // the recurring.plan.activated webhook sets Organization.currentSubscriptionId
    // once payment is authorized.
    await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        planId: planRecord.id,
        status: "PENDING",
        maxMembersSnapshot: maxMembers,
        priceAmountSnapshot: amount,
        currencySnapshot: "PHP",
        xenditCustomerId,
        xenditPlanId: plan.id,
      },
    });

    // Step 4: Get action URL for payment linking
    const actionUrl = plan.actions?.find((a) => a.action === "AUTH")?.url;

    if (!actionUrl) {
      return { success: false, error: "No action URL returned from Xendit" };
    }

    return { success: true, url: actionUrl };
  } catch (error) {
    console.error("Xendit subscription error:", error);
    return { success: false, error: "Failed to create subscription" };
  }
}

async function ensureSubscriptionOrganization(input: {
  userId: string;
  name: string;
  type: "PERSONAL" | "TEAM";
}) {
  const existingMembership = await prisma.organizationMember.findFirst({
    where: {
      userId: input.userId,
      role: "OWNER",
      organization: { type: input.type },
    },
    include: { organization: true },
    orderBy: { joinedAt: "asc" },
  });

  if (existingMembership) {
    return existingMembership.organization;
  }

  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: input.name,
        type: input.type,
      },
    });

    await tx.organizationMember.create({
      data: {
        userId: input.userId,
        organizationId: organization.id,
        role: "OWNER",
      },
    });

    if (input.type === "TEAM") {
      await tx.user.update({
        where: { id: input.userId },
        data: { role: "ORG_ADMIN" },
      });
    }

    return organization;
  });
}
