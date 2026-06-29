"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { generateMemberPasswordService } from "@/service/org/generateMemberPasswordService";
import { generateMemberPasswordSchema } from "@/lib/validation/org";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function generateMemberPasswordAction(
  memberId: string,
  organizationId: string,
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = generateMemberPasswordSchema.safeParse({
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

  return await generateMemberPasswordService(
    validationResult.data.memberId,
    validationResult.data.organizationId,
    validationResult.data.requestedByUserId
  );
}
