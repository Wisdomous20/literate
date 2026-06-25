import { getDisplayedSubscription } from "./resolveUserSubscription";

export async function getSubscriptionService(userId: string) {
  const resolved = await getDisplayedSubscription(userId);
  const subscription = resolved?.subscription
    ? {
        ...resolved.subscription,
        planType: resolved.subscription.plan.code,
        maxMembers: resolved.subscription.maxMembersSnapshot,
      }
    : null;

  return {
    success: true as const,
    subscription,
    source: resolved?.source ?? null,
    canManage: resolved?.canManage ?? false,
  };
}
