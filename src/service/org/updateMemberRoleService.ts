import { prisma } from "@/lib/prisma";
import { getOrgAdminContext } from "@/service/org/orgAuthorization";

export type OrganizationMemberRoleValue = "ADMIN" | "USER";

export async function updateMemberRoleService(
  memberId: string,
  organizationId: string,
  requestedByUserId: string,
  role: OrganizationMemberRoleValue,
) {
  const adminContext = await getOrgAdminContext(organizationId, requestedByUserId);

  if (!adminContext.success) {
    return { success: false, error: adminContext.error };
  }

  if (memberId === adminContext.context.organization.ownerId) {
    return {
      success: false,
      error: "The organization owner role cannot be changed",
    };
  }

  if (memberId === requestedByUserId) {
    return {
      success: false,
      error: "You cannot change your own organization role",
    };
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId,
      },
    },
  });

  if (!membership) {
    return { success: false, error: "User is not a member of this organization" };
  }

  await prisma.organizationMember.update({
    where: { id: membership.id },
    data: { role },
  });

  return {
    success: true,
    message: role === "ADMIN" ? "Member promoted to admin" : "Admin changed to user",
  };
}
