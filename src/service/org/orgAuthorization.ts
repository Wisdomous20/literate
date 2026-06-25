import { prisma } from "@/lib/prisma";

export interface OrgAdminContext {
  organization: {
    id: string;
    ownerId: string | null;
  };
  requesterMembershipId: string | null;
  isOwner: boolean;
}

export async function getOrgAdminContext(
  organizationId: string,
  requestedByUserId: string,
): Promise<
  | { success: true; context: OrgAdminContext }
  | { success: false; error: string }
> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      members: {
        where: {
          OR: [{ userId: requestedByUserId }, { role: "OWNER" }],
        },
        select: {
          id: true,
          userId: true,
          role: true,
        },
      },
    },
  });

  if (!organization) {
    return { success: false, error: "No organization found" };
  }

  const membership =
    organization.members.find((member) => member.userId === requestedByUserId) ??
    null;
  const ownerMembership =
    organization.members.find((member) => member.role === "OWNER") ?? null;
  const isOwner = membership?.role === "OWNER";
  const isAdmin = isOwner || membership?.role === "ADMIN";

  if (!isAdmin) {
    return {
      success: false,
      error: "Only organization admins can manage members",
    };
  }

  return {
    success: true,
    context: {
      organization: {
        id: organization.id,
        ownerId: ownerMembership?.userId ?? null,
      },
      requesterMembershipId: membership?.id ?? null,
      isOwner,
    },
  };
}

export async function findAdminOrganizationForUser(userId: string) {
  return prisma.organization.findFirst({
    where: {
      type: "TEAM",
      members: {
        some: {
          userId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
}
