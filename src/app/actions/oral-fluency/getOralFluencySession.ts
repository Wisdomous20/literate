"use server";

import { getOralFluencySessionService} from "@/service/oral-fluency/getOralFluencySessionService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { sessionIdQuerySchema } from "@/lib/validation/media";

export async function getOralFluencySessionAction(sessionId: string) {
  const validationResult = sessionIdQuerySchema.safeParse({ id: sessionId });

  if (!validationResult.success) {
    throw new Error(getFirstZodErrorMessage(validationResult.error));
  }

  const result = await getOralFluencySessionService(validationResult.data.id);

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch session.");
  }

  return result.session;
}
