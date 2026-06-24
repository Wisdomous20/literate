import { prisma } from "@/lib/prisma";
import { getOrgInvitation } from "@/service/org/orgInvitationRedisService";

export type InvitationStatus = "valid" | "not_found";

export interface InvitationDetails {
  status: InvitationStatus;
  email?: string;
  organizationName?: string;
  invitedByName?: string;
  expiresAt?: Date;
  userExists?: boolean;
  requiresLogin?: boolean;
  alreadyMember?: boolean;
}

export async function getInvitationDetailsService(
  token: string,
  authenticatedUserId?: string,
): Promise<InvitationDetails> {
  const invitation = await getOrgInvitation(token);
  if (!invitation) return { status: "not_found" };

  const [organization, invitedBy, existingUser] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: invitation.payload.organizationId },
      select: { name: true },
    }),
    prisma.user.findUnique({
      where: { id: invitation.payload.invitedById },
      select: { firstName: true, lastName: true },
    }),
    prisma.user.findFirst({
      where: { email: { equals: invitation.payload.email, mode: "insensitive" } },
      select: { id: true },
    }),
  ]);

  if (!organization) return { status: "not_found" };

  const alreadyMember = existingUser
    ? Boolean(
        await prisma.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: existingUser.id,
              organizationId: invitation.payload.organizationId,
            },
          },
        }),
      )
    : false;
  const invitedByName =
    [invitedBy?.firstName, invitedBy?.lastName].filter(Boolean).join(" ").trim() ||
    "Your organization admin";

  return {
    status: "valid",
    email: invitation.payload.email,
    organizationName: organization.name,
    invitedByName,
    expiresAt: new Date(invitation.payload.expiresAt),
    userExists: Boolean(existingUser),
    requiresLogin: Boolean(existingUser && existingUser.id !== authenticatedUserId),
    alreadyMember,
  };
}
