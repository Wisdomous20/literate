"use server";

import { adminInviteSuperAdminSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { recordActivityLog } from "@/service/activity/activityLogService";
import { inviteSuperAdminService } from "@/service/admin/inviteSuperAdminService";
import { requireRole } from "@/utils/roleCheck";

export async function inviteSuperAdminAction(input: { email: string }) {
  const session = await requireRole("SUPER_ADMIN");
  const validationResult = adminInviteSuperAdminSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false as const,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await inviteSuperAdminService({
    email: validationResult.data.email,
    invitedById: session.user.id,
  });

  if (result.success && result.invitation) {
    await recordActivityLog({
      actor: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      action: "SUPER_ADMIN_INVITED",
      entityType: "invitation",
      entityTitle: result.invitation.email,
      metadata: {
        email: result.invitation.email,
        expiresAt: result.invitation.expiresAt.toISOString(),
        role: "SUPER_ADMIN",
      },
    });
  }

  return result;
}
