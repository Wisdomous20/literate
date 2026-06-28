"use server";

import { getAdminOrganizationDetailService } from "@/service/admin/getAdminOrganizationDetailService";
import { requireRole } from "@/utils/roleCheck";

export async function getAdminOrganizationDetailAction(organizationId: string) {
  try {
    await requireRole("SUPER_ADMIN");
  } catch {
    return { success: false, error: "Forbidden" };
  }

  return await getAdminOrganizationDetailService(organizationId);
}
