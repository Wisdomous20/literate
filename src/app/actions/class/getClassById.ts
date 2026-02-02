"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getClassByIdService } from "@/service/class/getClassByIdService";

export async function getClassById(classId: string) {

    const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

    return await getClassByIdService(classId)
}