import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import {
  claimPassageAdminInvitation,
  consumePassageAdminInvitation,
  getPassageAdminInvitation,
  releasePassageAdminInvitationClaim,
} from "@/service/passage-admin/passageAdminInvitationRedisService";

interface AcceptPassageAdminInvitationInput {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AcceptPassageAdminInvitationSuccess {
  success: true;
  email: string;
  createdAccount: boolean;
}

interface AcceptPassageAdminInvitationFailure {
  success: false;
  error: string;
}

export type AcceptPassageAdminInvitationResult =
  | AcceptPassageAdminInvitationSuccess
  | AcceptPassageAdminInvitationFailure;

const MIN_PASSWORD_LENGTH = 8;

export async function acceptPassageAdminInvitationService(
  input: AcceptPassageAdminInvitationInput,
): Promise<AcceptPassageAdminInvitationResult> {
  const invitation = await getPassageAdminInvitation(input.token);
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

  if (existingUser?.role === "ADMIN") {
    return { success: false, error: "This user already has full admin access." };
  }

  if (existingUser?.role === "ORG_ADMIN") {
    return {
      success: false,
      error:
        "This account already has an organization-admin role. Ask the admin to invite a separate passage-admin account.",
    };
  }

  const claimId = await claimPassageAdminInvitation(invitation.tokenHash);
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
            role: "PASSAGE_ADMIN",
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
          role: "PASSAGE_ADMIN",
          isVerified: true,
          isDisabled: false,
        },
      });

      return { createdAccount: true };
    });

    await consumePassageAdminInvitation(
      invitation.tokenHash,
      claimId,
      invitation.payload,
    ).catch((error) => {
      console.error("Failed to consume passage admin invitation:", error);
    });

    return {
      success: true,
      email: invitation.payload.email,
      createdAccount: result.createdAccount,
    };
  } catch (error) {
    console.error("Failed to accept passage admin invitation:", error);
    return { success: false, error: "Unable to accept invitation. Please try again." };
  } finally {
    await releasePassageAdminInvitationClaim(invitation.tokenHash, claimId).catch(
      () => undefined,
    );
  }
}
