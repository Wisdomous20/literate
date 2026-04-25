"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { updateClassService } from "@/service/class/updateClassService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateClassSchema } from "@/lib/validation/classroom";
import { revalidatePath } from "next/cache";

export async function updateClass(
  classRoomId: string,
  name?: string,
  archived?: boolean
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = updateClassSchema.safeParse({
    userId: session.user.id,
    classRoomId,
    name,
    archived,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await updateClassService(validationResult.data);

  if (result.success) {
    revalidatePath("/classes");
  }

  return result;
}
