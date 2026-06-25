import { prisma } from "@/lib/prisma";
import { xenditRequest } from "@/lib/xendit";

export async function cancelSubscriptionService(userId: string) {
  const subscription = await findManageableSubscriptionForUser(userId);

  if (!subscription?.xenditPlanId) {
    return { success: false, error: "No active subscription" };
  }

  try {
    await xenditRequest(
      `/recurring/plans/${subscription.xenditPlanId}/deactivate`,
      "POST"
    );

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELED" },
    });

    return { success: true };
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return { success: false, error: "Failed to cancel subscription" };
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
