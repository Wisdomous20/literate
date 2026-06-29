import { prisma } from "@/lib/prisma";
import { getOrgAdminContext } from "@/service/org/orgAuthorization";

export async function renameOrganizationService(
  newName: string,
  organizationId: string,
  requestedByUserId: string,
) {
  if (!newName?.trim()) {
    return { success: false, error: "Organization name is required" };
  }

  const adminContext = await getOrgAdminContext(organizationId, requestedByUserId);
  if (!adminContext.success) {
    return { success: false, error: adminContext.error };
  }

  const updated = await prisma.organization.update({
    where: { id: organizationId },
    data: { name: newName.trim() },
  });

  return { success: true, organization: updated };
}
