"use server";

import { getInvitationDetailsService } from "@/service/org/getInvitationDetailsService";

export async function getInvitationAction(token: string) {
  return await getInvitationDetailsService(token);
}
