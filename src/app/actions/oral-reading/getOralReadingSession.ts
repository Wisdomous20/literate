"use server";

import { getOralReadingSessionService } from "@/service/oral-reading/getOralReadingSessionService";

export async function getOralReadingSessionAction(sessionId: string) {
  const result = await getOralReadingSessionService(sessionId);

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch session.");
  }

  return result.session;
}