import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { stopSubscriptionRenewalService } from "@/service/subscription/stopSubscriptionRenewalService";

interface AcceptInvitationInput {
  token: string;
  password?: string;
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
  input: AcceptInvitationInput
): Promise<AcceptInvitationResult> {
  const { token, password } = input;

  if (!token?.trim()) {
    return { success: false, error: "Missing invitation token" };
  }

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    include: {
      organization: {
        include: {
          subscription: { select: { maxMembers: true } },
          _count: {
            select: { members: { where: { user: { isDisabled: false } } } },
          },
        },
      },
    },
  });

  if (!invitation) {
    return { success: false, error: "Invitation not found" };
  }

  if (invitation.acceptedAt) {
    return { success: false, error: "This invitation has already been accepted" };
  }

  if (invitation.revokedAt) {
    return { success: false, error: "This invitation has been revoked" };
  }

  if (invitation.expiresAt.getTime() <= Date.now()) {
    return { success: false, error: "This invitation has expired" };
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: invitation.email, mode: "insensitive" } },
    select: { id: true },
  });

  if (existingUser) {
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId: invitation.organizationId,
        },
      },
    });

    if (existingMembership) {
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      return { success: false, error: "You are already a member of this organization" };
    }
  } else {
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      };
    }
  }

  const activeCount = invitation.organization._count.members;
  const maxMembers = invitation.organization.subscription?.maxMembers || 1;

  if (activeCount >= maxMembers) {
    return {
      success: false,
      error: "The organization has no seats available. Contact the owner.",
    };
  }

  const userId = await prisma.$transaction(async (tx) => {
    let userIdInTx: string;

    if (existingUser) {
      userIdInTx = existingUser.id;
    } else {
      const hashedPassword = await bcrypt.hash(password!, 10);
      const user = await tx.user.create({
        data: {
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          email: invitation.email,
          password: hashedPassword,
          isVerified: true,
          isDisabled: false,
          role: "USER",
        },
        select: { id: true },
      });
      userIdInTx = user.id;
    }

    await tx.organizationMember.create({
      data: {
        userId: userIdInTx,
        organizationId: invitation.organizationId,
      },
    });

    await tx.organizationInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    return userIdInTx;
  });

  if (!existingUser) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const schoolYear =
        now.getMonth() < 6 ? `${year - 1}-${year}` : `${year}-${year + 1}`;

      await prisma.classRoom.create({
        data: { name: "My Class", userId, schoolYear },
      });
    } catch (err) {
      // Default class is a nice-to-have; sign-up should still succeed if it fails.
      console.error("Failed to create default class:", err);
    }
  } else {
    // Existing user is now covered by the org's seat — stop their personal
    // auto-renewal. Keep access until the paid period ends (cancelAtPeriodEnd).
    try {
      await stopSubscriptionRenewalService(userId);
    } catch (err) {
      console.error("Failed to stop personal renewal on org accept:", err);
    }
  }

  return {
    success: true,
    email: invitation.email,
    createdAccount: !existingUser,
  };
}
