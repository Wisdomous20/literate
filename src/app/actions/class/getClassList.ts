"user server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getAllClassServiceBySchoolYear } from "@/service/class/getAllClassServiceBySchoolYear";

export async function getClassListBySchoolYear(schoolYear: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return await getAllClassServiceBySchoolYear(session.user.id, schoolYear);
}
