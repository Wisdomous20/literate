"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getClassByIdService } from "@/service/class/getClassByIdService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { getClassByIdSchema } from "@/lib/validation/classroom";

export async function getClassById(classRoomId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = getClassByIdSchema.safeParse({ classRoomId });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await getClassByIdService(validationResult.data.classRoomId);
}
