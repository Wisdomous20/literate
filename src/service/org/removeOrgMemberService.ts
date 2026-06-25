import { prisma } from "@/lib/prisma";
import { getOrgAdminContext } from "@/service/org/orgAuthorization";

export async function removeOrgMemberService(
  memberId: string,
  organizationId: string,
  requestedByUserId: string
) {
  const adminContext = await getOrgAdminContext(organizationId, requestedByUserId);

  if (!adminContext.success) {
    return { success: false, error: adminContext.error };
  }

  if (memberId === requestedByUserId) {
    return { success: false, error: "You cannot remove yourself from the organization" };
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId,
      },
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!membership) {
    return { success: false, error: "User is not a member of this organization" };
  }

  if (membership.role === "OWNER") {
    return {
      success: false,
      error: "The organization owner cannot be removed. Transfer ownership first.",
    };
  }

  await prisma.organizationMember.delete({
    where: { id: membership.id },
  });

  return {
    success: true,
    message: "Member removed from organization",
  };
}
