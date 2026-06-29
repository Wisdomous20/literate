"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { syncLatestPendingPaymentSessionSubscription } from "@/service/subscription/syncPaymentSessionSubscriptionService";

export async function syncPaymentSessionSubscriptionAction() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  try {
    return await syncLatestPendingPaymentSessionSubscription(session.user.id);
  } catch (error) {
    console.error("Payment session subscription sync error:", error);
    return {
      success: false as const,
      error:
        error instanceof Error
          ? `Failed to sync payment: ${error.message}`
          : "Failed to sync payment",
    };
  }
}
