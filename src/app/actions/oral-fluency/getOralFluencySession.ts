"use server";

import { getOralFluencySessionService} from "@/service/oral-fluency/getOralFluencySessionService";

export async function getOralFluencySessionAction(sessionId: string) {
  const result = await getOralFluencySessionService(sessionId);

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch session.");
  }

  return result.session;
}