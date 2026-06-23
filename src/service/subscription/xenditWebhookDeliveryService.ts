import { prisma } from "@/lib/prisma";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/**
 * Claims a provider delivery before applying side effects. The database unique
 * constraint serializes concurrent retries of the same callback.
 */
export async function claimXenditWebhookDelivery(
  id: string,
  event: string,
): Promise<"claimed" | "duplicate"> {
  try {
    await prisma.webhookDelivery.create({ data: { id, event } });
    return "claimed";
  } catch (error) {
    if (isUniqueConstraintError(error)) return "duplicate";
    throw error;
  }
}

export async function completeXenditWebhookDelivery(id: string): Promise<void> {
  await prisma.webhookDelivery.update({
    where: { id },
    data: { processedAt: new Date() },
  });
}

/** Makes an unsuccessful delivery eligible for a provider retry. */
export async function releaseXenditWebhookDelivery(id: string): Promise<void> {
  await prisma.webhookDelivery.delete({ where: { id } });
}
