"use server";

import { getOralReadingMiscues } from "@/service/oral-reading/getMiscuesService";


export async function fetchOralReadingMiscues(sessionId: string) {
  if (!sessionId) {
    return { success: false, error: "Session ID is required", data: null };
  }

  try {
    const miscues = await getOralReadingMiscues(sessionId);

    return { success: true, error: null, data: miscues };
  } catch (error) {
    console.error("Failed to fetch oral reading miscues:", error);
    return {
      success: false,
      error: "Failed to fetch oral reading miscues",
      data: null,
    };
  }
}