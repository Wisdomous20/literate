"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { updateClassService } from "@/service/class/updateClassService";
import { revalidatePath } from "next/cache";

export async function updateClass(
  classId: string,
  name?: string,
  archived?: boolean
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await updateClassService({
    userId: session.user.id,
    classId,
    name,
    archived,
  });

  if (result.success) {
    revalidatePath("/classes");
  }

  return result;
}