"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { toggleMemberStatusService } from "@/service/org/toggleMemberStatusService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { toggleMemberStatusSchema } from "@/lib/validation/org";

export async function toggleMemberAction(memberId: string, disable: boolean) {
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

  const validationResult = toggleMemberStatusSchema.safeParse({
    memberId,
    organizationId: org.id,
    requestedByUserId: session.user.id,
    disable,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await toggleMemberStatusService(
    validationResult.data.memberId,
    validationResult.data.organizationId,
    validationResult.data.requestedByUserId,
    validationResult.data.disable
  );
}
