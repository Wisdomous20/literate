"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getOrgMembersService } from "@/service/org/getOrgMembersService";
import { findAdminOrganizationForUser } from "@/service/org/orgAuthorization";

export async function getMembersAction() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const org = await findAdminOrganizationForUser(session.user.id);

  if (!org) {
    return { success: false, error: "No organization found" };
  }

  return await getOrgMembersService(org.id, session.user.id);
}
