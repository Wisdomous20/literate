"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { findAdminOrganizationForUser } from "@/service/org/orgAuthorization";

export async function hasOrgManagementAccessAction() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false as const, hasAccess: false };
  }

  const organization = await findAdminOrganizationForUser(session.user.id);

  return {
    success: true as const,
    hasAccess: Boolean(organization),
  };
}
