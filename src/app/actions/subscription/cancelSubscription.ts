"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { cancelSubscriptionService } from "@/service/subscription/cancelSubscriptionService";

export async function cancelSubscriptionAction() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return await cancelSubscriptionService(session.user.id);
}