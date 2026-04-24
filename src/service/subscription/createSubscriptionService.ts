import { randomUUID } from "crypto";
import { xenditRequest } from "@/lib/xendit";
import { prisma } from "@/lib/prisma";
import { calculatePrice, getMaxMembers, PlanKey } from "@/config/plans";

interface CreateSubscriptionInput {
  userId: string;
  userName: string;
  userEmail: string;
  planType: PlanKey;
  memberCount?: number;
}

export async function createSubscriptionService(input: CreateSubscriptionInput) {
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

  try {
    // Check for existing subscription
    const existingSub = await prisma.subscription.findUnique({
      where: { userId },
    });

    let xenditCustomerId = existingSub?.xenditCustomerId;

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
      reference_id: `literate-${planType.toLowerCase()}-${userId}-${uniqueId}`,
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
        planType,
        maxMembers: String(maxMembers),
      },
    });

    // Step 3: Save subscription record
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planType,
        status: "PENDING",
        maxMembers,
        xenditCustomerId,
        xenditPlanId: plan.id,
      },
      update: {
        planType,
        status: "PENDING",
        maxMembers,
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
