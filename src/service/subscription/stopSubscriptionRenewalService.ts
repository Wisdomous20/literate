import { prisma } from "@/lib/prisma";
import { xenditRequest } from "@/lib/xendit";

export interface StopRenewalSuccess {
  success: true;
  alreadyStopped: boolean;
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
    return { success: true, alreadyStopped: true };
  }

  if (subscription.status !== "ACTIVE" && subscription.status !== "PAST_DUE") {
    // Already canceled/expired/pending — nothing to stop.
    return { success: true, alreadyStopped: true };
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

    return { success: true, alreadyStopped: false };
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
        subscription: {
          is: {
            xenditPlanId: { not: null },
          },
        },
      },
    },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return (
    memberships.find((membership) => membership.organization.type === "PERSONAL")
      ?.organization.subscription ??
    memberships[0]?.organization.subscription ??
    null
  );
}
