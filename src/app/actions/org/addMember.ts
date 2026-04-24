"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { addOrgMemberService } from "@/service/org/addOrgMemberService";
import { addOrgMemberSchema } from "@/lib/validation/org";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function addMemberAction(input: {
  email: string;
  firstName: string;
  lastName: string;
}) {
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

  const validationResult = addOrgMemberSchema.safeParse({
    ...input,
    organizationId: org.id,
    requestedByUserId: session.user.id,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await addOrgMemberService(validationResult.data);
}
