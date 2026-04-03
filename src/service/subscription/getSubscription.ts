import { prisma } from "@/lib/prisma";

export async function getSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  return { success: true, subscription: subscription || null };
}