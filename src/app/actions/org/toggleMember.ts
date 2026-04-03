"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { toggleMemberStatusService } from "@/service/org/toggleMemberStatusService";

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

  return await toggleMemberStatusService(
    memberId,
    org.id,
    session.user.id,
    disable
  );
}