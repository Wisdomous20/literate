"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { renameOrganizationService } from "@/service/org/renameOrganizationService";

export async function renameOrgAction(newName: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return await renameOrganizationService(newName, session.user.id);
}