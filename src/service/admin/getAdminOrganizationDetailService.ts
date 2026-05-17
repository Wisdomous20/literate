import { prisma } from "@/lib/prisma";

interface AdminOrganizationDetailResult {
  success: boolean;
  organization?: {
    id: string;
    name: string;
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    subscriptionPlan: string | null;
    maxMembers: number | null;
    activeMemberCount: number;
    totalMemberCount: number;
    pendingInvitations: number;
    createdAt: Date;
    members: {
      membershipId: string;
      userId: string;
      name: string;
      email: string;
      role: "USER" | "ADMIN" | "ORG_ADMIN";
      isDisabled: boolean;
      isOwner: boolean;
      joinedAt: Date;
    }[];
  };
  error?: string;
}

export async function getAdminOrganizationDetailService(
  organizationId: string
): Promise<AdminOrganizationDetailResult> {
  try {
    const now = new Date();

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        createdAt: true,
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subscription: {
          select: {
            planType: true,
            maxMembers: true,
          },
        },
        invitations: {
          where: {
            acceptedAt: null,
            revokedAt: null,
            expiresAt: { gt: now },
          },
          select: {
            id: true,
          },
        },
        members: {
          orderBy: { joinedAt: "asc" },
          select: {
            id: true,
            userId: true,
            joinedAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isDisabled: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return { success: false, error: "Organization not found." };
    }

    const members = organization.members.map((membership) => ({
      membershipId: membership.id,
      userId: membership.userId,
      name:
        [membership.user.firstName, membership.user.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || "Unnamed user",
      email: membership.user.email ?? "No email",
      role: membership.user.role,
      isDisabled: membership.user.isDisabled,
      isOwner: membership.userId === organization.ownerId,
      joinedAt: membership.joinedAt,
    }));

    return {
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        ownerId: organization.ownerId,
        ownerName:
          [organization.owner.firstName, organization.owner.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() || "Unnamed owner",
        ownerEmail: organization.owner.email ?? "No email",
        subscriptionPlan: organization.subscription?.planType ?? null,
        maxMembers: organization.subscription?.maxMembers ?? null,
        activeMemberCount: members.filter((member) => !member.isDisabled).length,
        totalMemberCount: members.length,
        pendingInvitations: organization.invitations.length,
        createdAt: organization.createdAt,
        members,
      },
    };
  } catch (error) {
    console.error("Failed to load admin organization detail:", error);
    return { success: false, error: "Failed to load organization." };
  }
}
