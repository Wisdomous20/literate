"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createShareableLinkService } from "@/service/assessment/createShareableLinkService";
import type { AssessmentType } from "@/generated/prisma/enums";
import { createShareableLinkSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { buildApplicationUrl } from "@/lib/applicationUrl";

export async function createShareableLink(input: {
  studentId: string;
  passageId: string;
  type: AssessmentType;
  expiresAt?: string;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = createShareableLinkSchema.safeParse({
    teacherId: session.user.id,
    ...input,
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await createShareableLinkService(validationResult.data);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      ...("code" in result && { code: result.code }),
    };
  }

  return {
    success: true,
    url: buildApplicationUrl(
      `assess/${encodeURIComponent(result.link.token)}`,
    ),
    link: result.link,
  };
}
