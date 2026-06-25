import { prisma } from "@/lib/prisma";

export interface OrgAdminContext {
  organization: {
    id: string;
    ownerId: string;
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
      ownerId: true,
      members: {
        where: { userId: requestedByUserId },
        select: {
          id: true,
          role: true,
        },
      },
    },
  });

  if (!organization) {
    return { success: false, error: "No organization found" };
  }

  const membership = organization.members?.[0] ?? null;
  const isOwner = organization.ownerId === requestedByUserId;
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
        ownerId: organization.ownerId,
      },
      requesterMembershipId: membership?.id ?? null,
      isOwner,
    },
  };
}

export async function findAdminOrganizationForUser(userId: string) {
  return prisma.organization.findFirst({
    where: {
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
              role: "ADMIN",
            },
          },
        },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
}
