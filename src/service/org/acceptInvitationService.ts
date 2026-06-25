import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import {
  claimOrgInvitation,
  consumeOrgInvitation,
  getOrgInvitation,
  releaseOrgInvitationClaim,
} from "@/service/org/orgInvitationRedisService";
import { stopSubscriptionRenewalService } from "@/service/subscription/stopSubscriptionRenewalService";

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
          subscription: { select: { maxMembersSnapshot: true } },
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

      const maxMembers = organization.subscription?.maxMembersSnapshot || 1;
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

    if (!existingUser) {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const schoolYear =
          now.getMonth() < 6 ? `${year - 1}-${year}` : `${year}-${year + 1}`;

        await prisma.classRoom.create({
          data: { name: "My Class", userId: result.userId, schoolYear },
        });
      } catch (error) {
        console.error("Failed to create default class for invited user:", error);
      }
    } else {
      try {
        await stopSubscriptionRenewalService(result.userId);
      } catch (error) {
        console.error("Failed to stop personal renewal on organization accept:", error);
      }
    }

    return {
      success: true,
      email: invitation.payload.email,
      createdAccount: !existingUser,
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
