import { prisma } from "@/lib/prisma";
import { xenditRequest } from "@/lib/xendit";

export async function cancelSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription?.xenditPlanId) {
    return { success: false, error: "No active subscription" };
  }

  try {
    await xenditRequest(
      `/recurring/plans/${subscription.xenditPlanId}/deactivate`,
      "POST"
    );

    await prisma.subscription.update({
      where: { userId },
      data: { status: "CANCELED" },
    });

    return { success: true };
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}