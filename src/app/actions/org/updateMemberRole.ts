"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { updateMemberRoleSchema } from "@/lib/validation/org";
import { findAdminOrganizationForUser } from "@/service/org/orgAuthorization";
import {
  updateMemberRoleService,
  type OrganizationMemberRoleValue,
} from "@/service/org/updateMemberRoleService";

export async function updateMemberRoleAction(
  memberId: string,
  role: OrganizationMemberRoleValue,
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const org = await findAdminOrganizationForUser(session.user.id);

  if (!org) {
    return { success: false, error: "No organization found" };
  }

  const validationResult = updateMemberRoleSchema.safeParse({
    memberId,
    organizationId: org.id,
    requestedByUserId: session.user.id,
    role,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return updateMemberRoleService(
    validationResult.data.memberId,
    validationResult.data.organizationId,
    validationResult.data.requestedByUserId,
    validationResult.data.role,
  );
}
