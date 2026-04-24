"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { updateMemberPasswordService } from "@/service/org/updateMemberPasswordService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateMemberPasswordSchema } from "@/lib/validation/org";

export async function updateMemberPasswordAction(
  memberId: string,
  newPassword: string
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const org = await prisma.organization.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!org) {
    return { success: false, error: "No organization found" };
  }

  const validationResult = updateMemberPasswordSchema.safeParse({
    memberId,
    newPassword,
    organizationId: org.id,
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
