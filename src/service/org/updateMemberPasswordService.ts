import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function updateMemberPasswordService(
  memberId: string,
  newPassword: string,
  organizationId: string,
  requestedByUserId: string
) {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true },
  });

  if (!org || org.ownerId !== requestedByUserId) {
    return { success: false, error: "Only the organization owner can edit passwords" };
  }

  if (memberId === requestedByUserId) {
    return { success: false, error: "Use regular password change for your own account" };
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: memberId, organizationId } },
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