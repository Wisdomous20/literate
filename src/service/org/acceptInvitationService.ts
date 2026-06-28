import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import {
  claimOrgInvitation,
  consumeOrgInvitation,
  getOrgInvitation,
  releaseOrgInvitationClaim,
} from "@/service/org/orgInvitationRedisService";
import { stopSubscriptionRenewalService } from "@/service/subscription/stopSubscriptionRenewalService";
import { getSchoolYear } from "@/utils/getSchoolYear";

interface AcceptInvitationInput {
  token: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  authenticatedUserId?: string;
}

interface AcceptInvitationSuccess {
  success: true;
  email: string;
  createdAccount: boolean;
  /**
   * When an existing Solo subscriber accepted, the date their Solo plan stays
   * active through (auto-renewal stopped, no credit). Lets the UI confirm
   * "auto-renewal stopped; active until {date}."
   */
  soloActiveUntil?: Date | null;
}

interface AcceptInvitationFailure {
  success: false;
  error: string;
}

export type AcceptInvitationResult =
  | AcceptInvitationSuccess
  | AcceptInvitationFailure;

const MIN_PASSWORD_LENGTH = 8;

export async function acceptInvitationService(
  input: AcceptInvitationInput,
): Promise<AcceptInvitationResult> {
  const invitation = await getOrgInvitation(input.token);
  if (!invitation) {
    return { success: false, error: "Invitation not found or expired" };
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: invitation.payload.email, mode: "insensitive" } },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== input.authenticatedUserId) {
    return {
      success: false,
      error: "Sign in with the invited email address to accept this invitation.",
    };
  }

  if (!existingUser) {
    if (!input.password || input.password.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      };
    }

    if (!input.firstName?.trim() || !input.lastName?.trim()) {
      return { success: false, error: "First and last name are required" };
    }
  }

  const claimId = await claimOrgInvitation(invitation.tokenHash);
  if (!claimId) {
    return {
      success: false,
      error: "This invitation is already being accepted. Please try again shortly.",
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.findUnique({
        where: { id: invitation.payload.organizationId },
        include: {
          currentSubscription: { select: { maxMembersSnapshot: true } },
          _count: {
            select: {
              members: { where: { user: { isDisabled: false } } },
            },
          },
        },
      });

      if (!organization) {
        return { success: false as const, error: "Organization not found" };
      }

      if (existingUser) {
        const currentMembership = await tx.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: existingUser.id,
              organizationId: invitation.payload.organizationId,
            },
          },
        });

        if (currentMembership) {
          return {
            success: false as const,
            error: "You are already a member of this organization",
          };
        }

      }

      const maxMembers = organization.currentSubscription?.maxMembersSnapshot || 1;
      if (organization._count.members >= maxMembers) {
        return {
          success: false as const,
          error: "The organization has no seats available. Contact the owner.",
        };
      }

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const user = await tx.user.create({
          data: {
            firstName: input.firstName!.trim(),
            lastName: input.lastName!.trim(),
            email: invitation.payload.email,
            password: await bcrypt.hash(input.password!, 10),
            isVerified: true,
            isDisabled: false,
            role: "USER",
          },
          select: { id: true },
        });
        userId = user.id;
      }

      await tx.organizationMember.create({
        data: {
          userId,
          organizationId: invitation.payload.organizationId,
          role: "USER",
        },
      });

      return { success: true as const, userId };
    });

    if (!result.success) return result;

    await consumeOrgInvitation(
      invitation.tokenHash,
      claimId,
      invitation.payload,
    ).catch((error) => {
      console.error("Failed to consume accepted organization invitation:", error);
    });

    let soloActiveUntil: Date | null | undefined;

    if (!existingUser) {
      try {
        const schoolYear = getSchoolYear();

        await prisma.classRoom.create({
          data: { name: "My Class", userId: result.userId, schoolYear },
        });
      } catch (error) {
        console.error("Failed to create default class for invited user:", error);
      }
    } else {
      try {
        const stopResult = await stopSubscriptionRenewalService(result.userId);
        if (stopResult.success) {
          soloActiveUntil = stopResult.currentPeriodEnd;
        }
      } catch (error) {
        console.error("Failed to stop personal renewal on organization accept:", error);
      }
    }

    return {
      success: true,
      email: invitation.payload.email,
      createdAccount: !existingUser,
      soloActiveUntil,
    };
  } catch (error) {
    console.error("Failed to accept organization invitation:", error);
    return { success: false, error: "Unable to accept invitation. Please try again." };
  } finally {
    await releaseOrgInvitationClaim(invitation.tokenHash, claimId).catch(
      () => undefined,
    );
  }
}
