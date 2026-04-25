"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { updateProfileService } from "@/service/auth/updateProfileService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateProfileSchema } from "@/lib/validation/auth";

export async function updateProfileAction(
  firstName: string,
  lastName: string,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = updateProfileSchema.safeParse({
    firstName,
    lastName,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return updateProfileService(session.user.id, validationResult.data);
}
