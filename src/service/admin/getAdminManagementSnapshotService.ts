import { prisma } from "@/lib/prisma";
import type { userType } from "@/generated/prisma/enums";
import { countPendingOrgInvitations } from "@/service/org/orgInvitationRedisService";

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
    role: userType;
    isDisabled: boolean;
    isVerified: boolean;
    ownedOrganizationCount: number;
    membershipCount: number;
    createdAt: Date;
  }[];
  organizations: {
    id: string;
    name: string;
    ownerId: string | null;
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
    userRole: userType;
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
          createdAt: true,
          currentSubscription: {
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
            select: {
              userId: true,
              role: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  isDisabled: true,
                },
              },
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
          role: true,
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
      (organization) => organization.currentSubscription !== null
    ).length;
    const ownerMemberships = memberships.filter(
      (membership) => membership.role === "OWNER"
    );

    return {
      success: true,
      snapshot: {
        overview: {
          totalUsers,
          activeUsers: totalUsers - disabledUsers,
          disabledUsers,
          totalOrganizations: organizations.length,
          totalMemberships: memberships.length,
          organizationOwners: ownerMemberships.length,
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
          ownedOrganizationCount: ownerMemberships.filter(
            (membership) => membership.userId === user.id
          ).length,
          membershipCount: user._count.orgMemberships,
          createdAt: user.createdAt,
        })),
        organizations: await Promise.all(organizations.map(async (organization) => {
          const activeMemberCount = organization.members.filter(
            (member) => !member.user.isDisabled
          ).length;
          const pendingInvitations = await countPendingOrgInvitations(organization.id);
          const ownerMembership =
            organization.members.find((member) => member.role === "OWNER") ?? null;

          return {
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
            memberCount: organization.members.length,
            activeMemberCount,
            subscriptionPlan: organization.currentSubscription?.plan.code ?? null,
            maxMembers: organization.currentSubscription?.maxMembersSnapshot ?? null,
            pendingInvitations,
            createdAt: organization.createdAt,
          };
        })),
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
          isOwnerMembership: membership.role === "OWNER",
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
