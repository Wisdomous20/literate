"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { stopSubscriptionRenewalService } from "@/service/subscription/stopSubscriptionRenewalService";

export async function stopSubscriptionRenewalAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  return stopSubscriptionRenewalService(session.user.id);
}
