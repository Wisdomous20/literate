import { prisma } from "@/lib/prisma";

export async function createOrganizationService(name: string, ownerId: string) {
  if (!name?.trim()) {
    return { success: false, error: "Organization name is required" };
  }

  const user = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { role: true },
  });

  if (user?.role !== "ORG_ADMIN") {
    return { success: false, error: "Only ORG_ADMIN users can create organizations" };
  }

  const existing = await prisma.organization.findFirst({ where: { ownerId } });
  if (existing) {
    return { success: false, error: "You already own an organization" };
  }

  const org = await prisma.organization.create({
    data: { name: name.trim(), ownerId },
  });

  await prisma.organizationMember.create({
    data: { userId: ownerId, organizationId: org.id },
  });

  return { success: true, organization: org };
}