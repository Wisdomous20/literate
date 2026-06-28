"use server";

import {
  acceptPassageAdminInvitationService,
  type AcceptPassageAdminInvitationResult,
} from "@/service/passage-admin/acceptPassageAdminInvitationService";
import { acceptPassageAdminInvitationSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function acceptPassageAdminInvitationAction(input: {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<AcceptPassageAdminInvitationResult> {
  const validationResult = acceptPassageAdminInvitationSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false as const,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return acceptPassageAdminInvitationService(validationResult.data);
}
