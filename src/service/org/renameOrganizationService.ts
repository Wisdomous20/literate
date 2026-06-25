import { prisma } from "@/lib/prisma";
import { findAdminOrganizationForUser } from "@/service/org/orgAuthorization";

export async function renameOrganizationService(
  newName: string,
  requestedByUserId: string
) {
  if (!newName?.trim()) {
    return { success: false, error: "Organization name is required" };
  }

  const org = await findAdminOrganizationForUser(requestedByUserId);

  if (!org) {
    return { success: false, error: "No organization found" };
  }

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: { name: newName.trim() },
  });

  return { success: true, organization: updated };
}
