"use server";

import { getSuperAdminInvitationDetailsService } from "@/service/admin/getSuperAdminInvitationDetailsService";
import { superAdminInvitationTokenSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function getSuperAdminInvitationAction(token: string) {
  const validationResult = superAdminInvitationTokenSchema.safeParse({ token });

  if (!validationResult.success) {
    return {
      status: "not_found" as const,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return getSuperAdminInvitationDetailsService(validationResult.data.token);
}
