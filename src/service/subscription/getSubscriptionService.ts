import { getDisplayedSubscription } from "./resolveUserSubscription";

export async function getSubscriptionService(userId: string) {
  const resolved = await getDisplayedSubscription(userId);

  return {
    success: true as const,
    subscription: resolved?.subscription ?? null,
    source: resolved?.source ?? null,
    canManage: resolved?.canManage ?? false,
  };
}
