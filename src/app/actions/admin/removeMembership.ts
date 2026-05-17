"use server";

import { adminRemoveMembershipSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { removeMembershipByAdminService } from "@/service/admin/removeMembershipByAdminService";
import { requireRole } from "@/utils/roleCheck";

export async function removeMembershipByAdminAction(membershipId: string) {
  try {
    await requireRole("ADMIN");
  } catch {
    return { success: false, error: "Forbidden" };
  }

  const validationResult = adminRemoveMembershipSchema.safeParse({
    membershipId,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await removeMembershipByAdminService(validationResult.data.membershipId);
}
