"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { updateMemberPasswordService } from "@/service/org/updateMemberPasswordService";

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

  return await updateMemberPasswordService(
    memberId,
    newPassword,
    org.id,
    session.user.id
  );
}