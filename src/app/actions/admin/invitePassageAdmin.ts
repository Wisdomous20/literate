"use server";

import { adminInvitePassageAdminSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { recordActivityLog } from "@/service/activity/activityLogService";
import { invitePassageAdminService } from "@/service/passage-admin/invitePassageAdminService";
import { requireRole } from "@/utils/roleCheck";

export async function invitePassageAdminAction(input: { email: string }) {
  const session = await requireRole("SUPER_ADMIN");
  const validationResult = adminInvitePassageAdminSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false as const,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await invitePassageAdminService({
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
      action: "PASSAGE_ADMIN_INVITED",
      entityType: "invitation",
      entityTitle: result.invitation.email,
      metadata: {
        email: result.invitation.email,
        expiresAt: result.invitation.expiresAt.toISOString(),
        role: "PASSAGE_MANAGER",
      },
    });
  }

  return result;
}
