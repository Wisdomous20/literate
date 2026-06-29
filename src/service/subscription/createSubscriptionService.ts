import { prisma } from "@/lib/prisma";
import { calculatePrice, getMaxMembers, PLANS, PlanKey } from "@/config/plans";
import { changeSubscriptionPlanService } from "@/service/subscription/changeSubscriptionPlanService";
import { createXenditSubscriptionSession } from "@/service/subscription/xenditSubscriptionSession";

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
  input: CreateSubscriptionInput,
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

    const orgWithCurrent = await prisma.organization.findUnique({
      where: { id: organization.id },
      include: { currentSubscription: true },
    });
    if (orgWithCurrent?.currentSubscription?.status === "ACTIVE") {
      return changeSubscriptionPlanService(userId, planType, memberCount);
    }

    const priorSub = await prisma.subscription.findFirst({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
    });

    const xenditCustomerId = priorSub?.xenditCustomerId;

    const session = await createXenditSubscriptionSession({
      userId,
      userName,
      userEmail,
      organizationId: organization.id,
      xenditCustomerId,
      amount,
      currency: "PHP",
      immediatePayment: true,
      description: `Literate ${planType} Plan - Annual`,
      metadata: {
        userId,
        organizationId: organization.id,
        planId: planRecord.id,
        planType,
        maxMembers: String(maxMembers),
      },
    });

    await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        planId: planRecord.id,
        status: "PENDING",
        maxMembersSnapshot: maxMembers,
        priceAmountSnapshot: amount,
        currencySnapshot: "PHP",
        xenditCustomerId: session.customerId,
        xenditPlanId: session.recurringPlanId,
      },
    });

    return { success: true, url: session.paymentLinkUrl };
  } catch (error) {
    console.error("Xendit subscription error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to create subscription: ${error.message}`
          : "Failed to create subscription",
    };
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
