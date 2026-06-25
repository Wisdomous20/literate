"use server";

import {
  acceptInvitationService,
  type AcceptInvitationResult,
} from "@/service/org/acceptInvitationService";
import { acceptInvitationSchema } from "@/lib/validation/org";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function acceptInvitationAction(input: {
  token: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}): Promise<AcceptInvitationResult> {
  const validationResult = acceptInvitationSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false as const,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const session = await getServerSession(authOptions);

  return await acceptInvitationService({
    ...validationResult.data,
    authenticatedUserId: session?.user?.id,
  });
}
