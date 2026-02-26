"use server";

import { getOralFluencyMiscues } from "@/service/oral-fluency/getMiscuesService";


export async function fetchOralFluencyMiscues(sessionId: string) {
  if (!sessionId) {
    return { success: false, error: "Session ID is required", data: null };
  }

  try {
    const miscues = await getOralFluencyMiscues(sessionId);

    return { success: true, error: null, data: miscues };
  } catch (error) {
    console.error("Failed to fetch oral fluency miscues:", error);
    return {
      success: false,
      error: "Failed to fetch oral reading miscues",
      data: null,
    };
  }
}