import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getOrgAdminContext } from "@/service/org/orgAuthorization";

export async function updateMemberPasswordService(
  memberId: string,
  newPassword: string,
  organizationId: string,
  requestedByUserId: string
) {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  const adminContext = await getOrgAdminContext(organizationId, requestedByUserId);

  if (!adminContext.success) {
    return { success: false, error: adminContext.error };
  }

  if (memberId === requestedByUserId) {
    return { success: false, error: "Use regular password change for your own account" };
  }

  if (memberId === adminContext.context.organization.ownerId) {
    return { success: false, error: "The organization owner password cannot be managed here" };
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

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: memberId },
    data: { password: hashed },
  });

  return { success: true };
}
