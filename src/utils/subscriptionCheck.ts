import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getEffectiveActiveSubscription } from "@/service/subscription/resolveUserSubscription";

export async function requireActiveSubscription() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const resolved = await getEffectiveActiveSubscription(session.user.id);
  if (resolved) {
    return { session, subscription: resolved.subscription };
  }

  throw new Error("No active subscription");
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    return (await getEffectiveActiveSubscription(userId)) !== null;
  } catch {
    return false;
  }
}
