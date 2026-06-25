import { prisma } from "@/lib/prisma";
import { getOrgAdminContext } from "@/service/org/orgAuthorization";

export async function toggleMemberStatusService(
  memberId: string,
  organizationId: string,
  requestedByUserId: string,
  disable: boolean
) {
  const adminContext = await getOrgAdminContext(organizationId, requestedByUserId);

  if (!adminContext.success) {
    return { success: false, error: adminContext.error };
  }

  if (disable && memberId === requestedByUserId) {
    return { success: false, error: "You cannot disable your own account" };
  }

  if (memberId === adminContext.context.organization.ownerId) {
    return { success: false, error: "The organization owner cannot be disabled" };
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

  await prisma.user.update({
    where: { id: memberId },
    data: { isDisabled: disable },
  });

  return {
    success: true,
    message: disable ? "Member disabled" : "Member enabled",
  };
}
