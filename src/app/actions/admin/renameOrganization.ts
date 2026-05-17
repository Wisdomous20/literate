"use server";

import { adminRenameOrganizationSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { renameOrganizationByAdminService } from "@/service/admin/renameOrganizationByAdminService";
import { requireRole } from "@/utils/roleCheck";

export async function renameOrganizationByAdminAction(
  organizationId: string,
  name: string
) {
  try {
    await requireRole("ADMIN");
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const validationResult = adminRenameOrganizationSchema.safeParse({
    organizationId,
    name,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await renameOrganizationByAdminService(
    validationResult.data.organizationId,
    validationResult.data.name
  );
}
