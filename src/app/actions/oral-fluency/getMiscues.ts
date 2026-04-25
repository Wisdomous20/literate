"use server";

import { getOralFluencyMiscues } from "@/service/oral-fluency/getMiscuesService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { sessionIdQuerySchema } from "@/lib/validation/media";


export async function fetchOralFluencyMiscues(sessionId: string) {
  const validationResult = sessionIdQuerySchema.safeParse({ id: sessionId });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
      data: null,
    };
  }

  try {
    const miscues = await getOralFluencyMiscues(validationResult.data.id);

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
