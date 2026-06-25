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

async function findOrganizationSubscriptionForUser(
  userId: string,
  now: Date,
  activeOnly: boolean
): Promise<ResolvedUserSubscription | null> {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      organization: {
        subscription: activeOnly
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
          subscription: { include: { plan: true, organization: true } },
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

  const subscription = membership?.organization.subscription;
  if (!subscription) {
    return null;
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
