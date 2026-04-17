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
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

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
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });

    return { success: true, alreadyStopped: false };
  } catch (error) {
    console.error("Stop subscription renewal error:", error);
    return { success: false, error: "Failed to stop renewal" };
  }
}
