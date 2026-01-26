"user server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getClassListService } from "@/service/class/getClassListService";

export async function getClassList() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return await getClassListService(session.user.id);
}
