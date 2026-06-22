"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { getClassByIdSchema } from "@/lib/validation/classroom";
import { getArchivedStudentsByClassIdService } from "@/service/students/getArchivedStudentsByClassIdService";

export async function getArchivedStudentsByClassId(classRoomId: string) {
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

  return getArchivedStudentsByClassIdService({
    userId: session.user.id,
    classRoomId: validationResult.data.classRoomId,
  });
}
