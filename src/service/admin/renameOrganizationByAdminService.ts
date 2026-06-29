import { prisma } from "@/lib/prisma";

export async function renameOrganizationByAdminService(
  organizationId: string,
  name: string
) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true },
  });

  if (!organization) {
    return { success: false, error: "Organization not found." };
  }

  const updatedOrganization = await prisma.organization.update({
    where: { id: organizationId },
    data: { name: name.trim() },
    select: { id: true, name: true },
  });

  return {
    success: true,
    message: "Organization renamed.",
    organization: {
      id: updatedOrganization.id,
      previousName: organization.name,
      name: updatedOrganization.name,
    },
  };
}
