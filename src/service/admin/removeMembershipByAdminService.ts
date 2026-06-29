import { prisma } from "@/lib/prisma";

export async function removeMembershipByAdminService(membershipId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { id: membershipId },
    select: {
      id: true,
      role: true,
      organization: { select: { id: true, name: true } },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!membership) {
    return { success: false, error: "Membership not found." };
  }

  if (membership.role === "OWNER") {
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
    membership: {
      id: membership.id,
      role: membership.role,
      organizationId: membership.organization.id,
      organizationName: membership.organization.name,
      userId: membership.user.id,
      userEmail: membership.user.email,
      userName: [membership.user.firstName, membership.user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim(),
    },
  };
}
