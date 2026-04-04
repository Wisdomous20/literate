"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
  requestPasswordChangeService,
  confirmPasswordChangeService,
} from "@/service/auth/requestPasswordChangeService";

// Step 1: Verify current password → send code to email
export async function requestPasswordChangeAction(currentPassword: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return await requestPasswordChangeService(session.user.id, currentPassword);
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

  return await confirmPasswordChangeService(session.user.id, code, newPassword);
}