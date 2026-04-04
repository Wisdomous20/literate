import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function requireActiveSubscription() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const directSub = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      currentPeriodEnd: { gte: new Date() },
    },
  });

  if (directSub) return { session, subscription: directSub };

  const orgMembership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: {
      organization: { include: { subscription: true } },
    },
  });

  const orgSub = orgMembership?.organization?.subscription;
  if (
    orgSub?.status === "ACTIVE" &&
    orgSub.currentPeriodEnd &&
    orgSub.currentPeriodEnd >= new Date()
  ) {
    return { session, subscription: orgSub };
  }

  throw new Error("No active subscription");
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const direct = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE", currentPeriodEnd: { gte: new Date() } },
    });
    if (direct) return true;

    const org = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: { include: { subscription: true } } },
    });

    const sub = org?.organization?.subscription;
    return sub?.status === "ACTIVE" &&
      sub.currentPeriodEnd !== null &&
      sub.currentPeriodEnd >= new Date();
  } catch {
    return false;
  }
}