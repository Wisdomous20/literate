"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { deleteClassService } from "@/service/class/deleteClassService";
import { revalidatePath } from "next/cache";

export async function deleteClass(classId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await deleteClassService({
    userId: session.user.id,
    classId,
  });

  if (result.success) {
    revalidatePath("/classes");
  }

  return result;
}