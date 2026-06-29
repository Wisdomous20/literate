"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { removeOrgMemberSchema } from "@/lib/validation/org";
import { removeOrgMemberService } from "@/service/org/removeOrgMemberService";

export async function removeMemberAction(memberId: string, organizationId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = removeOrgMemberSchema.safeParse({
    memberId,
    organizationId,
    requestedByUserId: session.user.id,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return removeOrgMemberService(
    validationResult.data.memberId,
    validationResult.data.organizationId,
    validationResult.data.requestedByUserId
  );
}
