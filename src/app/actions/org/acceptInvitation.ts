"use server";

import { acceptInvitationService } from "@/service/org/acceptInvitationService";

export async function acceptInvitationAction(input: {
  token: string;
  password?: string;
}) {
  return await acceptInvitationService(input);
}
