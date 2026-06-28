import { prisma } from "@/lib/prisma";

type SubscriptionRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.subscription.findFirst>>
> & {
  plan: { code: string };
  organization: { type: "PERSONAL" | "TEAM" };
};

export type SubscriptionSource = "DIRECT" | "ORGANIZATION";

export interface ResolvedUserSubscription {
  subscription: SubscriptionRecord;
  source: SubscriptionSource;
  canManage: boolean;
}

function canManageOrganizationSubscription(role: string | null | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Lazily mark a row EXPIRED when it still reads ACTIVE/PAST_DUE but its paid
 * period has elapsed (e.g. a Solo plan whose renewal was stopped on org accept).
 * Guarded by the past-end condition so it is idempotent and safe to fire from a
 * read path. Fire-and-forget — the resolver already treats such a row as lapsed.
 */
function reconcileLapsedSubscription(
  subscription: { id: string; status: string; currentPeriodEnd: Date | null },
  now: Date,
): void {
  if (
    (subscription.status === "ACTIVE" || subscription.status === "PAST_DUE") &&
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd < now
  ) {
    prisma.subscription
      .updateMany({
        where: {
          id: subscription.id,
          status: { in: ["ACTIVE", "PAST_DUE"] },
          currentPeriodEnd: { lt: now },
        },
        data: { status: "EXPIRED" },
      })
      .catch((error) => {
        console.error("Failed to reconcile lapsed subscription:", error);
      });
  }
}

async function findOrganizationSubscriptionForUser(
  userId: string,
  now: Date,
  activeOnly: boolean
): Promise<ResolvedUserSubscription | null> {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      organization: {
        currentSubscription: activeOnly
          ? {
              is: {
                status: "ACTIVE",
                currentPeriodEnd: { gte: now },
              },
            }
          : { isNot: null },
      },
    },
    include: {
      organization: {
        include: {
          currentSubscription: { include: { plan: true, organization: true } },
        },
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  const membership =
    memberships.find((item) => item.organization.type === "PERSONAL") ??
    memberships[0];

  const subscription = membership?.organization.currentSubscription;
  if (!subscription) {
    return null;
  }

  if (!activeOnly) {
    reconcileLapsedSubscription(subscription, now);
  }

  return {
    subscription,
    source: membership.organization.type === "PERSONAL" ? "DIRECT" : "ORGANIZATION",
    canManage: canManageOrganizationSubscription(membership.role),
  };
}

export async function getEffectiveActiveSubscription(
  userId: string
): Promise<ResolvedUserSubscription | null> {
  const now = new Date();

  return findOrganizationSubscriptionForUser(userId, now, true);
}

export async function getDisplayedSubscription(
  userId: string
): Promise<ResolvedUserSubscription | null> {
  const now = new Date();
  return (
    (await getEffectiveActiveSubscription(userId)) ??
    findOrganizationSubscriptionForUser(userId, now, false)
  );
}
