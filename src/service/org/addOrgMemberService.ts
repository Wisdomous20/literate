import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendOrgInvitationEmail } from "@/service/notification/sendOrgInvitationEmail";

interface AddMemberInput {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  requestedByUserId: string;
}

const INVITATION_TTL_DAYS = 7;
const INVITATION_TTL_MS = INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000;

export async function addOrgMemberService(input: AddMemberInput) {
  const { email, firstName, lastName, organizationId, requestedByUserId } = input;

  if (!email?.trim() || !firstName?.trim() || !lastName?.trim()) {
    return { success: false, error: "Email, first name, and last name are required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email format" };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
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

  if (!org || org.ownerId !== requestedByUserId) {
    return { success: false, error: "Only the organization owner can add members" };
  }

  const now = new Date();

  const pendingInvitations = await prisma.organizationInvitation.count({
    where: {
      organizationId,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
  });

  const activeCount = org._count.members;
  const maxMembers = org.subscription?.maxMembers || 1;

  if (activeCount + pendingInvitations >= maxMembers) {
    return {
      success: false,
      error: `Seat limit reached (${activeCount} active, ${pendingInvitations} pending out of ${maxMembers}). Revoke an invitation, disable a member, or upgrade your plan.`,
    };
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    select: { id: true },
  });

  if (existingUser) {
    const existingMembership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: existingUser.id, organizationId } },
    });

    if (existingMembership) {
      return { success: false, error: "This user is already a member of your organization" };
    }
  }

  const existingInvitation = await prisma.organizationInvitation.findFirst({
    where: {
      organizationId,
      email: normalizedEmail,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
  });

  if (existingInvitation) {
    return {
      success: false,
      error: "An invitation for this email is already pending. Revoke it before sending a new one.",
    };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);

  const invitation = await prisma.organizationInvitation.create({
    data: {
      token,
      email: normalizedEmail,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      organizationId,
      invitedById: requestedByUserId,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptUrl = `${baseUrl}/accept-invitation?token=${token}`;
  const invitedByName =
    [org.owner?.firstName, org.owner?.lastName].filter(Boolean).join(" ").trim() ||
    "Your organization admin";

  try {
    await sendOrgInvitationEmail({
      to: normalizedEmail,
      inviteeFirstName: trimmedFirstName,
      organizationName: org.name,
      invitedByName,
      acceptUrl,
      expiresAt,
    });
  } catch (err) {
    // The invitation is useless without the email, so roll back so the owner can retry cleanly.
    await prisma.organizationInvitation.delete({ where: { id: invitation.id } });
    console.error("Failed to send invitation email:", err);
    return { success: false, error: "Could not send invitation email. Please try again." };
  }

  return {
    success: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      expiresAt: invitation.expiresAt,
    },
  };
}
