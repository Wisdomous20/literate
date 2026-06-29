"use server";

import { adminUpdateUserRoleSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { recordActivityLog } from "@/service/activity/activityLogService";
import { updateAdminUserRoleService } from "@/service/admin/updateAdminUserRoleService";
import { requireRole } from "@/utils/roleCheck";

export async function updateAdminUserRoleAction(userId: string, role: string) {
  let session;

  try {
    session = await requireRole("SUPER_ADMIN");
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const validationResult = adminUpdateUserRoleSchema.safeParse({
    userId,
    role,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await updateAdminUserRoleService(
    validationResult.data.userId,
    validationResult.data.role,
    session.user.id
  );

  if (result.success && result.user) {
    await recordActivityLog({
      actor: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      action: "USER_ROLE_UPDATED",
      entityType: "user",
      entityId: result.user.id,
      entityTitle: result.user.name || result.user.email || result.user.id,
      metadata: {
        previousRole: result.user.previousRole,
        newRole: result.user.newRole,
      },
    });
  }

  return result;
}
