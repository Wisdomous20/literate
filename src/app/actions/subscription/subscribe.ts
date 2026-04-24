"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createSubscriptionService } from "@/service/subscription/createSubscriptionService";
import { PlanKey } from "@/config/plans";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { subscribeSchema } from "@/lib/validation/subscription";

export async function subscribeAction(planType: PlanKey, memberCount?: number) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = subscribeSchema.safeParse({ planType, memberCount });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await createSubscriptionService({
    userId: session.user.id,
    userName: session.user.name || "",
    userEmail: session.user.email || "",
    planType: validationResult.data.planType,
    memberCount: validationResult.data.memberCount,
  });
}
