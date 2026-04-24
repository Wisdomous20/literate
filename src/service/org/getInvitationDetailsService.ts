import { prisma } from "@/lib/prisma";

export type InvitationStatus =
  | "valid"
  | "not_found"
  | "expired"
  | "revoked"
  | "accepted";

export interface InvitationDetails {
  status: InvitationStatus;
  email?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  invitedByName?: string;
  expiresAt?: Date;
  userExists?: boolean;
  alreadyMember?: boolean;
}

export async function getInvitationDetailsService(
  token: string
): Promise<InvitationDetails> {
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    include: {
      organization: { select: { name: true } },
      invitedBy: { select: { firstName: true, lastName: true } },
    },
  });

  if (!invitation) {
    return { status: "not_found" };
  }

  if (invitation.acceptedAt) {
    return { status: "accepted" };
  }

  if (invitation.revokedAt) {
    return { status: "revoked" };
  }

  if (invitation.expiresAt.getTime() <= Date.now()) {
    return { status: "expired" };
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: invitation.email, mode: "insensitive" } },
    select: { id: true },
  });

  let alreadyMember = false;
  if (existingUser) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId: invitation.organizationId,
        },
      },
    });
    alreadyMember = !!membership;
  }

  const invitedByName =
    [invitation.invitedBy?.firstName, invitation.invitedBy?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "Your organization admin";

  return {
    status: "valid",
    email: invitation.email,
    firstName: invitation.firstName,
    lastName: invitation.lastName,
    organizationName: invitation.organization.name,
    invitedByName,
    expiresAt: invitation.expiresAt,
    userExists: !!existingUser,
    alreadyMember,
  };
}
