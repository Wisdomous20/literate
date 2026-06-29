"use server";

import { adminToggleUserStatusSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { recordActivityLog } from "@/service/activity/activityLogService";
import { toggleAdminUserStatusService } from "@/service/admin/toggleAdminUserStatusService";
import { requireRole } from "@/utils/roleCheck";

export async function toggleAdminUserStatusAction(
  userId: string,
  disable: boolean
) {
  let session;

  try {
    session = await requireRole("SUPER_ADMIN");
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

  const result = await toggleAdminUserStatusService(
    validationResult.data.userId,
    validationResult.data.disable,
    session.user.id
  );

  if (result.success && result.user) {
    await recordActivityLog({
      actor: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      action: result.user.isDisabled ? "USER_DISABLED" : "USER_ENABLED",
      entityType: "user",
      entityId: result.user.id,
      entityTitle: result.user.name || result.user.email || result.user.id,
      metadata: {
        wasDisabled: result.user.wasDisabled,
        isDisabled: result.user.isDisabled,
      },
    });
  }

  return result;
}
