import { prisma } from "@/lib/prisma";

export async function toggleMemberStatusService(
  memberId: string,
  organizationId: string,
  requestedByUserId: string,
  disable: boolean
) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true },
  });

  if (!org || org.ownerId !== requestedByUserId) {
    return { success: false, error: "Only the organization owner can manage members" };
  }

  if (memberId === requestedByUserId) {
    return { success: false, error: "You cannot disable your own account" };
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
