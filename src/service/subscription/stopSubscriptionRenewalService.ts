import { prisma } from "@/lib/prisma";
import { xenditRequest } from "@/lib/xendit";

export interface StopRenewalSuccess {
  success: true;
  alreadyStopped: boolean;
  /** End of the paid period the plan stays active through (null if unknown). */
  currentPeriodEnd?: Date | null;
}

export interface StopRenewalFailure {
  success: false;
  error: string;
}

export type StopRenewalResult = StopRenewalSuccess | StopRenewalFailure;

export async function stopSubscriptionRenewalService(
  userId: string
): Promise<StopRenewalResult> {
  const subscription = await findManageableSubscriptionForUser(userId);

  if (!subscription?.xenditPlanId) {
    return { success: false, error: "No personal subscription to stop" };
  }

  if (subscription.cancelAtPeriodEnd) {
    return {
      success: true,
      alreadyStopped: true,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  if (subscription.status !== "ACTIVE" && subscription.status !== "PAST_DUE") {
    // Already canceled/expired/pending — nothing to stop.
    return {
      success: true,
      alreadyStopped: true,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  try {
    await xenditRequest(
      `/recurring/plans/${subscription.xenditPlanId}/deactivate`,
      "POST"
    );

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    return {
      success: true,
      alreadyStopped: false,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  } catch (error) {
    console.error("Stop subscription renewal error:", error);
    return { success: false, error: "Failed to stop renewal" };
  }
}

async function findManageableSubscriptionForUser(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      role: { in: ["OWNER", "ADMIN"] },
      organization: {
        currentSubscription: {
          is: {
            xenditPlanId: { not: null },
          },
        },
      },
    },
    include: {
      organization: {
        include: {
          currentSubscription: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return (
    memberships.find((membership) => membership.organization.type === "PERSONAL")
      ?.organization.currentSubscription ??
    memberships[0]?.organization.currentSubscription ??
    null
  );
}
