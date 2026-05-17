import { prisma } from "@/lib/prisma";

export async function removeMembershipByAdminService(membershipId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { id: membershipId },
    include: {
      organization: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!membership) {
    return { success: false, error: "Membership not found." };
  }

  if (membership.userId === membership.organization.ownerId) {
    return {
      success: false,
      error: "Owner memberships cannot be removed until ownership is transferred.",
    };
  }

  await prisma.organizationMember.delete({
    where: { id: membershipId },
  });

  return {
    success: true,
    message: "Membership removed.",
  };
}
