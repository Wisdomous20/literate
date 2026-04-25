import { z } from "zod";
import {
  fileSchema,
  idString,
  optionalUrlString,
  requiredString,
} from "@/lib/validation/common";
import { MiscueType, OralFluencyBehaviorType } from "@/generated/prisma/enums";

export const uploadAudioSchema = z.object({
  file: fileSchema("File"),
  filePath: requiredString("filePath"),
});

export const createAudioAssessmentSchema = z.object({
  studentId: idString("studentId"),
  passageId: idString("passageId"),
  audio: fileSchema("Audio file"),
  audioUrl: optionalUrlString("audioUrl").optional(),
});

export const transcriptionRequestSchema = z.object({
  assessmentId: idString("assessmentId"),
  audio: fileSchema("Audio file"),
  audioUrl: optionalUrlString("audioUrl").optional(),
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
  })
  .superRefine((data, ctx) => {
    if (data.action === "update" && !data.newMiscueType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newMiscueType"],
        message: "newMiscueType is required when action is 'update'.",
      });
    }
  });

export const updateBehaviorsSchema = z.object({
  sessionId: idString("sessionId"),
  behaviorTypes: z.array(z.nativeEnum(OralFluencyBehaviorType)),
});
