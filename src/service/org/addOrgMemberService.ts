import { prisma } from "@/lib/prisma";
import {
  createOrgInvitation,
  discardOrgInvitation,
} from "@/service/org/orgInvitationRedisService";
import { sendOrgInvitationEmail } from "@/service/notification/sendOrgInvitationEmail";
import { getOrgAdminContext } from "@/service/org/orgAuthorization";

interface AddMemberInput {
  email: string;
  organizationId: string;
  requestedByUserId: string;
}

export async function addOrgMemberService(input: AddMemberInput) {
  const normalizedEmail = input.email.toLowerCase().trim();

  if (!normalizedEmail) {
    return { success: false, error: "Email is required" };
  }

  const adminContext = await getOrgAdminContext(
    input.organizationId,
    input.requestedByUserId,
  );

  if (!adminContext.success) {
    return { success: false, error: adminContext.error };
  }

  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    include: {
      subscription: true,
      owner: { select: { firstName: true, lastName: true } },
      _count: {
        select: {
          members: { where: { user: { isDisabled: false } } },
        },
      },
    },
  });

  if (!org) {
    return {
      success: false,
      error: "No organization found",
    };
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    select: { id: true },
  });

  if (existingUser) {
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId: input.organizationId,
        },
      },
    });

    if (existingMembership) {
      return {
        success: false,
        error: "This user is already a member of your organization",
      };
    }
  }

  const maxMembers = org.subscription?.maxMembers || 1;
  const invitationResult = await createOrgInvitation({
    email: normalizedEmail,
    organizationId: input.organizationId,
    invitedById: input.requestedByUserId,
    activeMemberCount: org._count.members,
    maxMembers,
  });

  if (invitationResult.status === "duplicate") {
    return {
      success: false,
      error: "An invitation for this email is already pending.",
    };
  }

  if (invitationResult.status === "seat_limit") {
    return {
      success: false,
      error: `Seat limit reached (${org._count.members} active out of ${maxMembers}). Upgrade your plan or wait for a pending invitation to expire.`,
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptUrl = `${baseUrl}/accept-invitation?token=${invitationResult.token}`;
  const invitedByName =
    [org.owner?.firstName, org.owner?.lastName].filter(Boolean).join(" ").trim() ||
    "Your organization admin";

  try {
    await sendOrgInvitationEmail({
      to: normalizedEmail,
      organizationName: org.name,
      invitedByName,
      acceptUrl,
      expiresAt: invitationResult.expiresAt,
    });
  } catch (error) {
    await discardOrgInvitation(invitationResult.token, {
      email: normalizedEmail,
      organizationId: input.organizationId,
      invitedById: input.requestedByUserId,
      expiresAt: invitationResult.expiresAt.toISOString(),
    }).catch(() => undefined);
    console.error("Failed to send organization invitation email:", error);
    return {
      success: false,
      error: "Could not send invitation email. Please try again.",
    };
  }

  return {
    success: true,
    invitation: {
      email: normalizedEmail,
      expiresAt: invitationResult.expiresAt,
    },
  };
}
