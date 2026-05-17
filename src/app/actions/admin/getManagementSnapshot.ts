"use server";

import { getAdminManagementSnapshotService } from "@/service/admin/getAdminManagementSnapshotService";
import { requireRole } from "@/utils/roleCheck";

export async function getAdminManagementSnapshotAction() {
  try {
    await requireRole("ADMIN");
  } catch {
    return { success: false, error: "Forbidden" };
  }

  return await getAdminManagementSnapshotService();
}
