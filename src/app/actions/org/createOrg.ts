"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createOrganizationService } from "@/service/org/createOrganizationService";

export async function createOrgAction(name: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return await createOrganizationService(name, session.user.id);
}