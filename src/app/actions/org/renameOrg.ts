"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { renameOrganizationService } from "@/service/org/renameOrganizationService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { renameOrganizationSchema } from "@/lib/validation/org";

export async function renameOrgAction(newName: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = renameOrganizationSchema.safeParse({
    newName,
    requestedByUserId: session.user.id,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await renameOrganizationService(
    validationResult.data.newName,
    validationResult.data.requestedByUserId
  );
}
