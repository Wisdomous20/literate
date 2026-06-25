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

  const existing = await prisma.organizationMember.findFirst({
    where: {
      userId: ownerId,
      role: "OWNER",
      organization: { type: "TEAM" },
    },
  });
  if (existing) {
    return { success: false, error: "You already own an organization" };
  }

  const org = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: name.trim(), type: "TEAM" },
    });

    await tx.organizationMember.create({
      data: { userId: ownerId, organizationId: organization.id, role: "OWNER" },
    });

    return organization;
  });

  return { success: true, organization: org };
}
