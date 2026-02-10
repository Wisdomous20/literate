"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {  getStudentsByClassNameService } from "@/service/students/getAllStudentByClassService";

export async function getStudentsByClassName(className: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const result = await getStudentsByClassNameService(session.user.id, className);
    return result;
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return {
      success: false,
      error: "Failed to fetch students",
      code: "INTERNAL_ERROR",
    };
  }
}