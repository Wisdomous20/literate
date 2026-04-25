"use server";

import { getInvitationDetailsService } from "@/service/org/getInvitationDetailsService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { invitationTokenSchema } from "@/lib/validation/org";

export async function getInvitationAction(token: string) {
  const validationResult = invitationTokenSchema.safeParse({ token });

  if (!validationResult.success) {
    return {
      status: "not_found" as const,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await getInvitationDetailsService(validationResult.data.token);
}
