import { prisma } from "@/lib/prisma";
import {
  createSuperAdminInvitation,
  discardSuperAdminInvitation,
} from "@/service/admin/superAdminInvitationRedisService";
import { sendSuperAdminInvitationEmail } from "@/service/notification/sendSuperAdminInvitationEmail";

interface InviteSuperAdminInput {
  email: string;
  invitedById: string;
}

export async function inviteSuperAdminService(input: InviteSuperAdminInput) {
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

  if (existingUser?.role === "SUPER_ADMIN") {
    return {
      success: false,
      error: "This user already has full admin access.",
    };
  }

  const invitationResult = await createSuperAdminInvitation({
    email: normalizedEmail,
    invitedById: input.invitedById,
  });

  if (invitationResult.status === "duplicate") {
    return {
      success: false,
      error: "A super-admin invitation for this email is already pending.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptUrl = `${baseUrl}/accept-super-admin-invitation?token=${invitationResult.token}`;
  const invitedByName =
    [invitedBy?.firstName, invitedBy?.lastName].filter(Boolean).join(" ").trim() ||
    "A LiteRate admin";

  try {
    await sendSuperAdminInvitationEmail({
      to: normalizedEmail,
      invitedByName,
      acceptUrl,
      expiresAt: invitationResult.expiresAt,
    });
  } catch (error) {
    await discardSuperAdminInvitation(invitationResult.token, {
      email: normalizedEmail,
      invitedById: input.invitedById,
      expiresAt: invitationResult.expiresAt.toISOString(),
    }).catch(() => undefined);
    console.error("Failed to send super admin invitation email:", error);
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
