"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createOrganizationService } from "@/service/org/createOrganizationService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { createOrganizationSchema } from "@/lib/validation/org";

export async function createOrgAction(name: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = createOrganizationSchema.safeParse({
    name,
    ownerId: session.user.id,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  return await createOrganizationService(
    validationResult.data.name,
    validationResult.data.ownerId
  );
}
