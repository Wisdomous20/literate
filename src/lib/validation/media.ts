import { z } from "zod";
import {
  fileSchema,
  idString,
  requiredString,
} from "@/lib/validation/common";
import { MiscueType, OralFluencyBehaviorType } from "@/generated/prisma/enums";

const MAX_AUDIO_UPLOAD_BYTES = 50 * 1024 * 1024;
const AUDIO_FILE_EXTENSIONS = /\.(wav|webm|m4a|mp3|ogg)$/i;

const audioUrlString = requiredString("audioUrl").pipe(
  z.string().url("audioUrl must be a valid URL"),
);

const audioFileNameSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : undefined),
  z.string().min(1, "fileName is required").max(255).optional(),
);

const audioFileSchema = fileSchema("Audio file")
  .refine(
    (file) => file.size <= MAX_AUDIO_UPLOAD_BYTES,
    "Audio file must be 50MB or smaller",
  )
  .refine(
    (file) => file.type.startsWith("audio/"),
    "Audio file must be an audio MIME type",
  );

export const uploadAudioSchema = z.object({
  file: audioFileSchema,
  filePath: requiredString("filePath")
    .refine(
      (path) => path.startsWith("oral-fluency/"),
      "filePath must be within oral-fluency/",
    )
    .refine(
      (path) => !path.includes("..") && !path.includes("\\"),
      "filePath contains invalid path segments",
    )
    .refine(
      (path) => AUDIO_FILE_EXTENSIONS.test(path),
      "filePath must end with a supported audio extension",
    ),
});

export const createAudioAssessmentSchema = z.object({
  studentId: idString("studentId"),
  passageId: idString("passageId"),
  audio: audioFileSchema.optional(),
  audioUrl: audioUrlString,
  fileName: audioFileNameSchema,
});

export const transcriptionRequestSchema = z.object({
  assessmentId: idString("assessmentId"),
  audio: audioFileSchema.optional(),
  audioUrl: audioUrlString,
  fileName: audioFileNameSchema,
});

export const sessionIdQuerySchema = z.object({
  id: idString("Session ID"),
});

export const assessmentIdQuerySchema = z.object({
  assessmentId: idString("assessmentId"),
});

export const updateMiscueSchema = z
  .object({
    miscueId: idString("miscueId"),
    action: z.enum(["approve", "delete", "update"]),
    newMiscueType: z.nativeEnum(MiscueType).optional(),
    newSpokenWord: z.string().trim().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.action === "update" &&
      !data.newMiscueType &&
      !data.newSpokenWord
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newMiscueType"],
        message:
          "Either newMiscueType or newSpokenWord is required when action is 'update'.",
      });
    }
  });

export const updateBehaviorsSchema = z.object({
  sessionId: idString("sessionId"),
  behaviorTypes: z.array(z.nativeEnum(OralFluencyBehaviorType)),
});
