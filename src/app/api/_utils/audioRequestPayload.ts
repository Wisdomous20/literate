import { NextRequest } from "next/server";

export class InvalidRequestBodyError extends Error {
  constructor(message = "Invalid request body") {
    super(message);
    this.name = "InvalidRequestBodyError";
  }
}

async function readJsonPayload(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new InvalidRequestBodyError("Malformed JSON body");
  }
}

function fileNameFromAudio(audio: FormDataEntryValue | null): string | undefined {
  return audio instanceof File ? audio.name : undefined;
}

async function readFormPayload(
  request: NextRequest,
  fields: string[],
): Promise<Record<string, FormDataEntryValue | undefined>> {
  const formData = await request.formData();
  const audio = formData.get("audio");

  return {
    ...Object.fromEntries(fields.map((field) => [field, formData.get(field) ?? undefined])),
    audio: audio ?? undefined,
    audioUrl: formData.get("audioUrl") ?? undefined,
    fileName: formData.get("fileName") ?? fileNameFromAudio(audio),
  };
}

async function readAudioPayload(
  request: NextRequest,
  fields: string[],
): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return readJsonPayload(request);
  }

  return readFormPayload(request, fields);
}

export function readCreateAudioAssessmentPayload(request: NextRequest) {
  return readAudioPayload(request, ["studentId", "passageId"]);
}

export function readTranscriptionPayload(request: NextRequest) {
  return readAudioPayload(request, ["assessmentId"]);
}
