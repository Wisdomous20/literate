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
    miscueId: idString("miscueId").optional(),
    action: z.enum(["approve", "delete", "update", "create"]),
    sessionId: idString("sessionId").optional(),
    newMiscueType: z.nativeEnum(MiscueType).optional(),
    newSpokenWord: z.string().trim().min(1).optional(),
    expectedWord: z.string().trim().optional(),
    spokenWord: z.string().trim().min(1).nullable().optional(),
    wordIndex: z.number().int().min(0).optional(),
    timestamp: z.number().nullable().optional(),
    isSelfCorrected: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action !== "create" && !data.miscueId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["miscueId"],
        message: "miscueId is required unless action is 'create'.",
      });
    }

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

    if (data.action === "create") {
      if (!data.sessionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sessionId"],
          message: "sessionId is required when action is 'create'.",
        });
      }
      if (!data.newMiscueType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newMiscueType"],
          message: "newMiscueType is required when action is 'create'.",
        });
      }
      if (
        data.expectedWord === undefined ||
        (data.newMiscueType !== MiscueType.INSERTION &&
          data.expectedWord.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expectedWord"],
          message:
            data.newMiscueType === MiscueType.INSERTION
              ? "expectedWord is required when action is 'create'."
              : "expectedWord must not be empty when action is 'create'.",
        });
      }
      if (data.wordIndex === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["wordIndex"],
          message: "wordIndex is required when action is 'create'.",
        });
      }
    }
  });

export const updateBehaviorsSchema = z.object({
  sessionId: idString("sessionId"),
  behaviorTypes: z.array(z.nativeEnum(OralFluencyBehaviorType)),
});
