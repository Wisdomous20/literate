"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { hasActiveSubscription } from "@/utils/subscriptionCheck";

export async function hasActiveAccessAction() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false as const, hasAccess: false };
  }

  const hasAccess = await hasActiveSubscription(session.user.id);
  return { success: true as const, hasAccess };
}
