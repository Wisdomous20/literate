import { prisma } from "@/lib/prisma";
import { getSuperAdminInvitation } from "@/service/admin/superAdminInvitationRedisService";

export type SuperAdminInvitationStatus = "valid" | "not_found";

export interface SuperAdminInvitationDetails {
  status: SuperAdminInvitationStatus;
  email?: string;
  invitedByName?: string;
  expiresAt?: Date;
  userExists?: boolean;
}

export async function getSuperAdminInvitationDetailsService(
  token: string,
): Promise<SuperAdminInvitationDetails> {
  const invitation = await getSuperAdminInvitation(token);
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
