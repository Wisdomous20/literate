"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { deleteClassService } from "@/service/class/deleteClassService";
import { revalidatePath } from "next/cache";

export async function deleteClass(classRoomId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const result = await deleteClassService({
    userId: session.user.id,
    classRoomId,
  });

  if (result.success) {
    revalidatePath("/dashboard/classes");
  }

  return result;
}