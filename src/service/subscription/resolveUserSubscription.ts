import { prisma } from "@/lib/prisma";

type SubscriptionRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.subscription.findFirst>>
>;

export type SubscriptionSource = "DIRECT" | "ORGANIZATION";

export interface ResolvedUserSubscription {
  subscription: SubscriptionRecord;
  source: SubscriptionSource;
  canManage: boolean;
}

async function findActiveOrganizationSubscription(
  userId: string,
  now: Date
): Promise<ResolvedUserSubscription | null> {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organization: {
        subscription: {
          is: {
            status: "ACTIVE",
            currentPeriodEnd: { gte: now },
          },
        },
      },
    },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  const subscription = membership?.organization.subscription;
  if (!subscription) {
    return null;
  }

  return {
    subscription,
    source: "ORGANIZATION",
    canManage: subscription.userId === userId,
  };
}

async function findActiveDirectSubscription(
  userId: string,
  now: Date
): Promise<ResolvedUserSubscription | null> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      currentPeriodEnd: { gte: now },
    },
  });

  if (!subscription) {
    return null;
  }

  return {
    subscription,
    source: "DIRECT",
    canManage: true,
  };
}

async function findDirectSubscription(
  userId: string
): Promise<ResolvedUserSubscription | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return null;
  }

  return {
    subscription,
    source: "DIRECT",
    canManage: true,
  };
}

export async function getEffectiveActiveSubscription(
  userId: string
): Promise<ResolvedUserSubscription | null> {
  const now = new Date();

  return (
    (await findActiveOrganizationSubscription(userId, now)) ??
    (await findActiveDirectSubscription(userId, now))
  );
}

export async function getDisplayedSubscription(
  userId: string
): Promise<ResolvedUserSubscription | null> {
  return (await getEffectiveActiveSubscription(userId)) ?? findDirectSubscription(userId);
}
