"use server";

import { adminToggleUserStatusSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { toggleAdminUserStatusService } from "@/service/admin/toggleAdminUserStatusService";
import { requireRole } from "@/utils/roleCheck";

export async function toggleAdminUserStatusAction(
  userId: string,
  disable: boolean
) {
  let session;

  try {
    session = await requireRole("ADMIN");
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const validationResult = adminToggleUserStatusSchema.safeParse({
    userId,
    disable,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await toggleAdminUserStatusService(
    validationResult.data.userId,
    validationResult.data.disable,
    session.user.id
  );
}
