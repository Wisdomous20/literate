"use server";

import { adminRemoveMembershipSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { recordActivityLog } from "@/service/activity/activityLogService";
import { removeMembershipByAdminService } from "@/service/admin/removeMembershipByAdminService";
import { requireRole } from "@/utils/roleCheck";

export async function removeMembershipByAdminAction(membershipId: string) {
  let session;

  try {
    session = await requireRole("SUPER_ADMIN");
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

  const result = await removeMembershipByAdminService(
    validationResult.data.membershipId
  );

  if (result.success && result.membership) {
    await recordActivityLog({
      actor: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      action: "MEMBERSHIP_REMOVED",
      entityType: "membership",
      entityId: result.membership.id,
      entityTitle:
        result.membership.userName ||
        result.membership.userEmail ||
        result.membership.id,
      metadata: {
        role: result.membership.role,
        organizationId: result.membership.organizationId,
        organizationName: result.membership.organizationName,
        userId: result.membership.userId,
        userEmail: result.membership.userEmail,
      },
    });
  }

  return result;
}
