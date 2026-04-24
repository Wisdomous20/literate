"use server";

import {
  acceptInvitationService,
  type AcceptInvitationResult,
} from "@/service/org/acceptInvitationService";
import { acceptInvitationSchema } from "@/lib/validation/org";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function acceptInvitationAction(input: {
  token: string;
  password?: string;
}): Promise<AcceptInvitationResult> {
  const validationResult = acceptInvitationSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false as const,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await acceptInvitationService(validationResult.data);
}
