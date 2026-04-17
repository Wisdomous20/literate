"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { generateMemberPasswordService } from "@/service/org/generateMemberPasswordService";

export async function generateMemberPasswordAction(memberId: string) {
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

  return await generateMemberPasswordService(
    memberId,
    org.id,
    session.user.id
  );
}
