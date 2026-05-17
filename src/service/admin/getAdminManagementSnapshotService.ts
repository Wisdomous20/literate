import { prisma } from "@/lib/prisma";

export interface AdminManagementSnapshot {
  overview: {
    totalUsers: number;
    activeUsers: number;
    disabledUsers: number;
    totalOrganizations: number;
    totalMemberships: number;
    organizationOwners: number;
    subscribedOrganizations: number;
    totalPassages: number;
  };
  users: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN" | "ORG_ADMIN";
    isDisabled: boolean;
    isVerified: boolean;
    ownedOrganizationCount: number;
    membershipCount: number;
    createdAt: Date;
  }[];
  organizations: {
    id: string;
    name: string;
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    memberCount: number;
    activeMemberCount: number;
    subscriptionPlan: string | null;
    maxMembers: number | null;
    pendingInvitations: number;
    createdAt: Date;
  }[];
  memberships: {
    membershipId: string;
    joinedAt: Date;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: "USER" | "ADMIN" | "ORG_ADMIN";
    organizationId: string;
    organizationName: string;
    isOwnerMembership: boolean;
    userDisabled: boolean;
  }[];
  passages: {
    id: string;
    title: string;
    language: string;
    level: number;
    testType: string;
    wordCount: number;
    updatedAt: Date;
  }[];
}

interface AdminManagementSnapshotResult {
  success: boolean;
  snapshot?: AdminManagementSnapshot;
  error?: string;
}

export async function getAdminManagementSnapshotService(): Promise<AdminManagementSnapshotResult> {
  try {
    const now = new Date();
    const [users, organizations, memberships, passages] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isDisabled: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              ownedOrganizations: true,
              orgMemberships: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.organization.findMany({
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
          members: {
            select: {
              user: {
                select: {
                  isDisabled: true,
                },
              },
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
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.organizationMember.findMany({
        select: {
          id: true,
          joinedAt: true,
          userId: true,
          organizationId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              isDisabled: true,
            },
          },
          organization: {
            select: {
              name: true,
              ownerId: true,
            },
          },
        },
        orderBy: [{ joinedAt: "desc" }],
      }),
      prisma.passage.findMany({
        select: {
          id: true,
          title: true,
          language: true,
          level: true,
          testType: true,
          content: true,
          updatedAt: true,
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
    ]);

    const totalUsers = users.length;
    const disabledUsers = users.filter((user) => user.isDisabled).length;
    const organizationsWithSubscription = organizations.filter(
      (organization) => organization.subscription !== null
    ).length;

    return {
      success: true,
      snapshot: {
        overview: {
          totalUsers,
          activeUsers: totalUsers - disabledUsers,
          disabledUsers,
          totalOrganizations: organizations.length,
          totalMemberships: memberships.length,
          organizationOwners: organizations.length,
          subscribedOrganizations: organizationsWithSubscription,
          totalPassages: passages.length,
        },
        users: users.map((user) => ({
          id: user.id,
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
            "Unnamed user",
          email: user.email ?? "No email",
          role: user.role,
          isDisabled: user.isDisabled,
          isVerified: user.isVerified,
          ownedOrganizationCount: user._count.ownedOrganizations,
          membershipCount: user._count.orgMemberships,
          createdAt: user.createdAt,
        })),
        organizations: organizations.map((organization) => {
          const activeMemberCount = organization.members.filter(
            (member) => !member.user.isDisabled
          ).length;

          return {
            id: organization.id,
            name: organization.name,
            ownerId: organization.ownerId,
            ownerName:
              [
                organization.owner.firstName,
                organization.owner.lastName,
              ]
                .filter(Boolean)
                .join(" ")
                .trim() || "Unnamed owner",
            ownerEmail: organization.owner.email ?? "No email",
            memberCount: organization.members.length,
            activeMemberCount,
            subscriptionPlan: organization.subscription?.planType ?? null,
            maxMembers: organization.subscription?.maxMembers ?? null,
            pendingInvitations: organization.invitations.length,
            createdAt: organization.createdAt,
          };
        }),
        memberships: memberships.map((membership) => ({
          membershipId: membership.id,
          joinedAt: membership.joinedAt,
          userId: membership.userId,
          userName:
            [membership.user.firstName, membership.user.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() || "Unnamed user",
          userEmail: membership.user.email ?? "No email",
          userRole: membership.user.role,
          organizationId: membership.organizationId,
          organizationName: membership.organization.name,
          isOwnerMembership: membership.organization.ownerId === membership.userId,
          userDisabled: membership.user.isDisabled,
        })),
        passages: passages.map((passage) => ({
          id: passage.id,
          title: passage.title,
          language: passage.language,
          level: passage.level,
          testType: passage.testType,
          wordCount: passage.content.split(/\s+/).filter(Boolean).length,
          updatedAt: passage.updatedAt,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to build admin management snapshot:", error);
    return {
      success: false,
      error: "Failed to load admin management data.",
    };
  }
}
