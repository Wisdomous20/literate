"use server";

import { adminUpdateUserRoleSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateAdminUserRoleService } from "@/service/admin/updateAdminUserRoleService";
import { requireRole } from "@/utils/roleCheck";

export async function updateAdminUserRoleAction(userId: string, role: string) {
  let session;

  try {
    session = await requireRole("ADMIN");
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

  return await updateAdminUserRoleService(
    validationResult.data.userId,
    validationResult.data.role,
    session.user.id
  );
}
