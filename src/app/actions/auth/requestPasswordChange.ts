"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
  requestPasswordChangeService,
  confirmPasswordChangeService,
} from "@/service/auth/requestPasswordChangeService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import {
  confirmPasswordChangeSchema,
  requestPasswordChangeSchema,
} from "@/lib/validation/auth";

// Step 1: Verify current password → send code to email
export async function requestPasswordChangeAction(currentPassword: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = requestPasswordChangeSchema.safeParse({
    currentPassword,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await requestPasswordChangeService(
    session.user.id,
    validationResult.data.currentPassword
  );
}

// Step 2: Verify code → update password
export async function confirmPasswordChangeAction(
  code: string,
  newPassword: string
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = confirmPasswordChangeSchema.safeParse({
    code,
    newPassword,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await confirmPasswordChangeService(
    session.user.id,
    validationResult.data.code,
    validationResult.data.newPassword
  );
}
