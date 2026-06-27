"use server";

import { getOralFluencyResultService} from "@/service/oral-fluency/getOralFluencyResultService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { sessionIdQuerySchema } from "@/lib/validation/media";
import { requireAuth } from "@/utils/roleCheck";

export async function getOralFluencyResultAction(sessionId: string) {
  const session = await requireAuth();
  const validationResult = sessionIdQuerySchema.safeParse({ id: sessionId });

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  const result = await getOralFluencyResultService(
    validationResult.data.id,
    session.user.id
  );

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch session.");
  }

  return result.session;
}
