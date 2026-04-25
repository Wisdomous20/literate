"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { deleteClassService } from "@/service/class/deleteClassService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { deleteClassSchema } from "@/lib/validation/classroom";
import { revalidatePath } from "next/cache";

export async function deleteClass(classRoomId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = deleteClassSchema.safeParse({
    userId: session.user.id,
    classRoomId,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await deleteClassService(validationResult.data);

  if (result.success) {
    revalidatePath("/dashboard/classes");
  }

  return result;
}
