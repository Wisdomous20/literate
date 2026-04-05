"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createShareableLinkService } from "@/service/assessment-link/createShareableLinkService";
import type { AssessmentType } from "@/generated/prisma/enums";

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

  const result = await createShareableLinkService({
    teacherId: session.user.id,
    ...input,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      ...("code" in result && { code: result.code }),
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    success: true,
    url: `${baseUrl}/assess/${result.link.token}`,
    link: result.link,
  };
}