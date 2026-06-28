import { prisma } from "@/lib/prisma";
import {
  createPassageAdminInvitation,
  discardPassageAdminInvitation,
} from "@/service/passage-admin/passageAdminInvitationRedisService";
import { sendPassageAdminInvitationEmail } from "@/service/notification/sendPassageAdminInvitationEmail";

interface InvitePassageAdminInput {
  email: string;
  invitedById: string;
}

export async function invitePassageAdminService(input: InvitePassageAdminInput) {
  const normalizedEmail = input.email.toLowerCase().trim();

  if (!normalizedEmail) {
    return { success: false, error: "Email is required" };
  }

  const [invitedBy, existingUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.invitedById },
      select: { firstName: true, lastName: true },
    }),
    prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { role: true },
    }),
  ]);

  if (existingUser?.role === "ADMIN") {
    return {
      success: false,
      error: "This user already has full admin access.",
    };
  }

  if (existingUser?.role === "ORG_ADMIN") {
    return {
      success: false,
      error:
        "This user already has an organization-admin role. Create a separate passage-admin account for them.",
    };
  }

  const invitationResult = await createPassageAdminInvitation({
    email: normalizedEmail,
    invitedById: input.invitedById,
  });

  if (invitationResult.status === "duplicate") {
    return {
      success: false,
      error: "A passage-admin invitation for this email is already pending.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptUrl = `${baseUrl}/accept-passage-admin-invitation?token=${invitationResult.token}`;
  const invitedByName =
    [invitedBy?.firstName, invitedBy?.lastName].filter(Boolean).join(" ").trim() ||
    "A LiteRate admin";

  try {
    await sendPassageAdminInvitationEmail({
      to: normalizedEmail,
      invitedByName,
      acceptUrl,
      expiresAt: invitationResult.expiresAt,
    });
  } catch (error) {
    await discardPassageAdminInvitation(invitationResult.token, {
      email: normalizedEmail,
      invitedById: input.invitedById,
      expiresAt: invitationResult.expiresAt.toISOString(),
    }).catch(() => undefined);
    console.error("Failed to send passage admin invitation email:", error);
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
