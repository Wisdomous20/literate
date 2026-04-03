"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getSubscription } from "@/service/subscription/getSubscription";

export async function getSubscriptionAction() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return await getSubscription(session.user.id);
}