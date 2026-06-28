"use server";

import {
  getInviteAcceptPreviewService,
  type InviteAcceptPreview,
} from "@/service/org/getInviteAcceptPreviewService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { invitationTokenSchema } from "@/lib/validation/org";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function getInviteAcceptPreviewAction(
  token: string,
): Promise<InviteAcceptPreview & { error?: string }> {
  const validationResult = invitationTokenSchema.safeParse({ token });

  if (!validationResult.success) {
    return {
      valid: false,
      hasActivePersonalSubscription: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const session = await getServerSession(authOptions);

  return await getInviteAcceptPreviewService(
    validationResult.data.token,
    session?.user?.id,
  );
}
