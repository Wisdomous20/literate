import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { generateOrgPassword } from "@/utils/generateOrgPassword";

export async function generateMemberPasswordService(
  memberId: string,
  organizationId: string,
  requestedByUserId: string
) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true, name: true },
  });

  if (!org || org.ownerId !== requestedByUserId) {
    return {
      success: false,
      error: "Only the organization owner can reset passwords",
    };
  }

  if (memberId === requestedByUserId) {
    return {
      success: false,
      error: "Use regular password change for your own account",
    };
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: memberId, organizationId } },
    include: {
      user: { select: { email: true, lastName: true } },
    },
  });

  if (!membership) {
    return {
      success: false,
      error: "User is not a member of this organization",
    };
  }

  const newPassword = generateOrgPassword(
    org.name,
    membership.user.lastName ?? "User"
  );
  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: memberId },
    data: { password: hashed },
  });

  return {
    success: true,
    email: membership.user.email,
    password: newPassword,
  };
}
