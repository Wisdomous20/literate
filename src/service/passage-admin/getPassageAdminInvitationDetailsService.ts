import { prisma } from "@/lib/prisma";
import { getPassageAdminInvitation } from "@/service/passage-admin/passageAdminInvitationRedisService";

export type PassageAdminInvitationStatus = "valid" | "not_found";

export interface PassageAdminInvitationDetails {
  status: PassageAdminInvitationStatus;
  email?: string;
  invitedByName?: string;
  expiresAt?: Date;
  userExists?: boolean;
}

export async function getPassageAdminInvitationDetailsService(
  token: string,
): Promise<PassageAdminInvitationDetails> {
  const invitation = await getPassageAdminInvitation(token);
  if (!invitation) return { status: "not_found" };

  const [invitedBy, existingUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: invitation.payload.invitedById },
      select: { firstName: true, lastName: true },
    }),
    prisma.user.findFirst({
      where: { email: { equals: invitation.payload.email, mode: "insensitive" } },
      select: { id: true },
    }),
  ]);

  const invitedByName =
    [invitedBy?.firstName, invitedBy?.lastName].filter(Boolean).join(" ").trim() ||
    "A LiteRate admin";

  return {
    status: "valid",
    email: invitation.payload.email,
    invitedByName,
    expiresAt: new Date(invitation.payload.expiresAt),
    userExists: Boolean(existingUser),
  };
}
