import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { generateOrgPassword } from "@/utils/generateOrgPassword";
import { getOrgAdminContext } from "@/service/org/orgAuthorization";

export async function generateMemberPasswordService(
  memberId: string,
  organizationId: string,
  requestedByUserId: string
) {
  const adminContext = await getOrgAdminContext(organizationId, requestedByUserId);

  if (!adminContext.success) {
    return {
      success: false,
      error: adminContext.error,
    };
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true, name: true },
  });

  if (!org) {
    return {
      success: false,
      error: "No organization found",
    };
  }

  if (memberId === requestedByUserId) {
    return {
      success: false,
      error: "Use regular password change for your own account",
    };
  }

  if (memberId === adminContext.context.organization.ownerId) {
    return {
      success: false,
      error: "The organization owner password cannot be managed here",
    };
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId,
      },
    },
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
