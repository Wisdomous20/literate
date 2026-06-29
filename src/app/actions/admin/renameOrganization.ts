"use server";

import { adminRenameOrganizationSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { recordActivityLog } from "@/service/activity/activityLogService";
import { renameOrganizationByAdminService } from "@/service/admin/renameOrganizationByAdminService";
import { requireRole } from "@/utils/roleCheck";

export async function renameOrganizationByAdminAction(
  organizationId: string,
  name: string
) {
  let session;

  try {
    session = await requireRole("SUPER_ADMIN");
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

  const result = await renameOrganizationByAdminService(
    validationResult.data.organizationId,
    validationResult.data.name
  );

  if (result.success && result.organization) {
    await recordActivityLog({
      actor: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      action: "ORGANIZATION_RENAMED",
      entityType: "organization",
      entityId: result.organization.id,
      entityTitle: result.organization.name,
      metadata: {
        previousName: result.organization.previousName,
        name: result.organization.name,
      },
    });
  }

  return result;
}
