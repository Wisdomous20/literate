import { prisma } from "@/lib/prisma";

export async function renameOrganizationService(
  newName: string,
  requestedByUserId: string
) {
  if (!newName?.trim()) {
    return { success: false, error: "Organization name is required" };
  }

  const org = await prisma.organization.findFirst({
    where: { ownerId: requestedByUserId },
  });

  if (!org) {
    return { success: false, error: "No organization found" };
  }

  if (org.ownerId !== requestedByUserId) {
    return { success: false, error: "Only the organization owner can rename it" };
  }

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: { name: newName.trim() },
  });

  return { success: true, organization: updated };
}