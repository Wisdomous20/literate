"use server";

import { adminInviteSuperAdminSchema } from "@/lib/validation/admin";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
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

  return inviteSuperAdminService({
    email: validationResult.data.email,
    invitedById: session.user.id,
  });
}
