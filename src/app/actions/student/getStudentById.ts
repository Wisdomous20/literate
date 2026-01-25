"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getStudentServiceById } from "@/service/students/getStudentServiceById";

export async function getStudentAction(studentId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return await getStudentServiceById(session.user.id, studentId);
}