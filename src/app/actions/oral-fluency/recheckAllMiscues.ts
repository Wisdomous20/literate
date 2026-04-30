"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { sessionIdQuerySchema } from "@/lib/validation/media";
import { recheckAllMiscuesService } from "@/service/oral-fluency/recheckAllMiscuesService";

export async function recheckAllMiscuesAction(sessionId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = sessionIdQuerySchema.safeParse({ id: sessionId });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }

  const result = await recheckAllMiscuesService(
    validationResult.data.id,
    session.user.id,
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    summary: result.summary,
    analysis: result.analysis,
  };
}
