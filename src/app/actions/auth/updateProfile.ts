"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { updateProfileService } from "@/service/auth/updateProfileService";

export async function updateProfileAction(
  firstName: string,
  lastName: string,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  return updateProfileService(session.user.id, { firstName, lastName });
}
