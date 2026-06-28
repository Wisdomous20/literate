"use server";

import { getPassageAdminInvitationDetailsService } from "@/service/passage-admin/getPassageAdminInvitationDetailsService";
import { passageAdminInvitationTokenSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function getPassageAdminInvitationAction(token: string) {
  const validationResult = passageAdminInvitationTokenSchema.safeParse({ token });

  if (!validationResult.success) {
    return {
      status: "not_found" as const,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return getPassageAdminInvitationDetailsService(validationResult.data.token);
}
