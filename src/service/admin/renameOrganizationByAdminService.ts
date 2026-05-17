import { prisma } from "@/lib/prisma";

export async function renameOrganizationByAdminService(
  organizationId: string,
  name: string
) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });

  if (!organization) {
    return { success: false, error: "Organization not found." };
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { name: name.trim() },
  });

  return {
    success: true,
    message: "Organization renamed.",
  };
}
