"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getSubscriptionService } from "@/service/subscription/getSubscriptionService";

export async function getSubscriptionAction() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return await getSubscriptionService(session.user.id);
}