"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getShareableLinksService } from "@/service/assessment-link/getShareableLinksService";

export async function getShareableLinks() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return await getShareableLinksService(session.user.id);
}