"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createSubscriptionService } from "@/service/subscription/createSubscriptionService";
import { PlanKey } from "@/config/plans";

export async function subscribeAction(planType: PlanKey, memberCount?: number) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return await createSubscriptionService({
    userId: session.user.id,
    userName: session.user.name || "",
    userEmail: session.user.email || "",
    planType,
    memberCount,
  });
}