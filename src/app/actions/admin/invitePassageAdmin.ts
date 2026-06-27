"use server";

import { adminInvitePassageAdminSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { invitePassageAdminService } from "@/service/passage-admin/invitePassageAdminService";
import { requireRole } from "@/utils/roleCheck";

export async function invitePassageAdminAction(input: { email: string }) {
  const session = await requireRole("ADMIN");
  const validationResult = adminInvitePassageAdminSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false as const,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return invitePassageAdminService({
    email: validationResult.data.email,
    invitedById: session.user.id,
  });
}
