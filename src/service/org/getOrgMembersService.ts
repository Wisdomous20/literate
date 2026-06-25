import { prisma } from "@/lib/prisma";
import { getOrgAdminContext } from "@/service/org/orgAuthorization";

export async function getOrgMembersService(organizationId: string, requestedByUserId: string) {
  const adminContext = await getOrgAdminContext(organizationId, requestedByUserId);

  if (!adminContext.success) {
    return { success: false, error: adminContext.error };
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: { include: { plan: true } },
      _count: {
        select: {
          members: { where: { user: { isDisabled: false } } },
        },
      },
    },
  });

  if (!org) {
    return { success: false, error: "No organization found" };
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
      plan: org.subscription?.plan.code || null,
      maxMembers: org.subscription?.maxMembersSnapshot || 0,
      currentMembers: org._count.members,
      totalMembers: members.length,
    },
    members: members.map((m) => ({
      membershipId: m.id,
      role: m.role === "OWNER" ? "ADMIN" : m.role,
      joinedAt: m.joinedAt,
      isOwner: m.role === "OWNER",
      ...m.user,
    })),
  };
}
