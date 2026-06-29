"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { updateMemberPasswordService } from "@/service/org/updateMemberPasswordService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateMemberPasswordSchema } from "@/lib/validation/org";

export async function updateMemberPasswordAction(
  memberId: string,
  newPassword: string,
  organizationId: string,
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = updateMemberPasswordSchema.safeParse({
    memberId,
    newPassword,
    organizationId,
    requestedByUserId: session.user.id,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await updateMemberPasswordService(
    validationResult.data.memberId,
    validationResult.data.newPassword,
    validationResult.data.organizationId,
    validationResult.data.requestedByUserId
  );
}
