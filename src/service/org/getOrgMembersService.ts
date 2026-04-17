import { prisma } from "@/lib/prisma";

export async function getOrgMembersService(organizationId: string, requestedByUserId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: true,
      _count: {
        select: {
          members: { where: { user: { isDisabled: false } } },
        },
      },
    },
  });

  if (!org || org.ownerId !== requestedByUserId) {
    return { success: false, error: "Only the organization owner can view members" };
  }

  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isDisabled: true,
          createdAt: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return {
    success: true,
    organization: {
      id: organizationId,
      name: org.name,
      plan: org.subscription?.planType || null,
      maxMembers: org.subscription?.maxMembers || 0,
      currentMembers: org._count.members,
      totalMembers: members.length,
    },
    members: members.map((m) => ({
      membershipId: m.id,
      joinedAt: m.joinedAt,
      isOwner: m.userId === org.ownerId,
      ...m.user,
    })),
  };
}