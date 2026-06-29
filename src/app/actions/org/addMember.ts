"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { addOrgMemberService } from "@/service/org/addOrgMemberService";
import { addOrgMemberSchema } from "@/lib/validation/org";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function addMemberAction(input: {
  email: string;
  organizationId: string;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = addOrgMemberSchema.safeParse({
    ...input,
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
