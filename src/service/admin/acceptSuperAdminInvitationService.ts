import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import {
  claimSuperAdminInvitation,
  consumeSuperAdminInvitation,
  getSuperAdminInvitation,
  releaseSuperAdminInvitationClaim,
} from "@/service/admin/superAdminInvitationRedisService";

interface AcceptSuperAdminInvitationInput {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AcceptSuperAdminInvitationSuccess {
  success: true;
  email: string;
  createdAccount: boolean;
}

interface AcceptSuperAdminInvitationFailure {
  success: false;
  error: string;
}

export type AcceptSuperAdminInvitationResult =
  | AcceptSuperAdminInvitationSuccess
  | AcceptSuperAdminInvitationFailure;

const MIN_PASSWORD_LENGTH = 8;

export async function acceptSuperAdminInvitationService(
  input: AcceptSuperAdminInvitationInput,
): Promise<AcceptSuperAdminInvitationResult> {
  const invitation = await getSuperAdminInvitation(input.token);
  if (!invitation) {
    return { success: false, error: "Invitation not found or expired" };
  }

  if (!input.password || input.password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: invitation.payload.email, mode: "insensitive" } },
    select: { id: true, role: true },
  });

  if (!existingUser && (!input.firstName?.trim() || !input.lastName?.trim())) {
    return { success: false, error: "First and last name are required" };
  }

  if (existingUser?.role === "SUPER_ADMIN") {
    return { success: false, error: "This user already has full admin access." };
  }

  const claimId = await claimSuperAdminInvitation(invitation.tokenHash);
  if (!claimId) {
    return {
      success: false,
      error: "This invitation is already being accepted. Please try again shortly.",
    };
  }

  try {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const result = await prisma.$transaction(async (tx) => {
      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            password: passwordHash,
            role: "SUPER_ADMIN",
            isVerified: true,
            isDisabled: false,
          },
        });

        return { createdAccount: false };
      }

      await tx.user.create({
        data: {
          firstName: input.firstName!.trim(),
          lastName: input.lastName!.trim(),
          email: invitation.payload.email,
          password: passwordHash,
          role: "SUPER_ADMIN",
          isVerified: true,
          isDisabled: false,
        },
      });

      return { createdAccount: true };
    });

    await consumeSuperAdminInvitation(
      invitation.tokenHash,
      claimId,
      invitation.payload,
    ).catch((error) => {
      console.error("Failed to consume super admin invitation:", error);
    });

    return {
      success: true,
      email: invitation.payload.email,
      createdAccount: result.createdAccount,
    };
  } catch (error) {
    console.error("Failed to accept super admin invitation:", error);
    return { success: false, error: "Unable to accept invitation. Please try again." };
  } finally {
    await releaseSuperAdminInvitationClaim(invitation.tokenHash, claimId).catch(
      () => undefined,
    );
  }
}
