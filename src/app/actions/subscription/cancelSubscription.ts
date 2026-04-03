"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { cancelSubscription } from "@/service/subscription/cancelSubscription";

export async function cancelSubscriptionAction() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return await cancelSubscription(session.user.id);
}