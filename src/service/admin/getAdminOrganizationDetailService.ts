import { prisma } from "@/lib/prisma";
import type { userType } from "@/generated/prisma/enums";
import { countPendingOrgInvitations } from "@/service/org/orgInvitationRedisService";

interface AdminOrganizationDetailResult {
  success: boolean;
  organization?: {
    id: string;
    name: string;
    ownerId: string | null;
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
      role: userType;
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
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        subscription: {
          select: {
            maxMembersSnapshot: true,
            plan: {
              select: {
                code: true,
              },
            },
          },
        },
        members: {
          orderBy: { joinedAt: "asc" },
          select: {
            id: true,
            userId: true,
            role: true,
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

    const ownerMembership =
      organization.members.find((membership) => membership.role === "OWNER") ??
      null;

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
      isOwner: membership.role === "OWNER",
      joinedAt: membership.joinedAt,
    }));

    return {
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        ownerId: ownerMembership?.userId ?? null,
        ownerName:
          [
            ownerMembership?.user.firstName,
            ownerMembership?.user.lastName,
          ]
            .filter(Boolean)
            .join(" ")
            .trim() || "Unnamed owner",
        ownerEmail: ownerMembership?.user.email ?? "No email",
        subscriptionPlan: organization.subscription?.plan.code ?? null,
        maxMembers: organization.subscription?.maxMembersSnapshot ?? null,
        activeMemberCount: members.filter((member) => !member.isDisabled).length,
        totalMemberCount: members.length,
        pendingInvitations: await countPendingOrgInvitations(organization.id),
        createdAt: organization.createdAt,
        members,
      },
    };
  } catch (error) {
    console.error("Failed to load admin organization detail:", error);
    return { success: false, error: "Failed to load organization." };
  }
}
