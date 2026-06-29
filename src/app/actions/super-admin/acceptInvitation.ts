"use server";

import {
  acceptSuperAdminInvitationService,
  type AcceptSuperAdminInvitationResult,
} from "@/service/admin/acceptSuperAdminInvitationService";
import { acceptSuperAdminInvitationSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function acceptSuperAdminInvitationAction(input: {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<AcceptSuperAdminInvitationResult> {
  const validationResult = acceptSuperAdminInvitationSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false as const,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return acceptSuperAdminInvitationService(validationResult.data);
}
