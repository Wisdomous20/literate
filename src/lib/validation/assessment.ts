import { z } from "zod";
import {
  idString,
  isoDateString,
  optionalTrimmedString,
  requiredString,
} from "@/lib/validation/common";

const assessmentTypeValues = [
  "ORAL_READING",
  "COMPREHENSION",
  "READING_FLUENCY",
] as const;

const assessmentTypeSchema = z.enum(assessmentTypeValues);

export const createAssessmentSchema = z.object({
  studentId: requiredString("studentId"),
  passageId: requiredString("passageId"),
  type: assessmentTypeSchema,
});

export const createShareableLinkSchema = z.object({
  teacherId: idString("Teacher ID"),
  studentId: idString("Student ID"),
  passageId: idString("Passage ID"),
  type: assessmentTypeSchema,
  expiresAt: isoDateString("Deadline").optional(),
});

const assessmentTypeFilterValues = [
  "ALL",
  ...assessmentTypeValues,
] as const;

const testTypeFilterValues = ["PRE", "POST"] as const;

const gradeFilterSchema = z.union([
  z.literal("ALL"),
  z.coerce.number().int().min(0).max(12),
]);

export const classificationDistributionQuerySchema = z.object({
  schoolYear: requiredString("schoolYear"),
  assessmentType: z.enum(assessmentTypeFilterValues).optional().default("ALL"),
  testType: z.enum(testTypeFilterValues).optional().default("PRE"),
  grade: gradeFilterSchema.optional().default("ALL"),
});

export const assessmentIdSchema = z.object({
  assessmentId: idString("Assessment ID"),
});

export const getAssessmentByIdSchema = z.object({
  id: idString("Assessment ID"),
});

export const getAssessmentsByStudentSchema = z.object({
  studentId: optionalTrimmedString(),
  type: assessmentTypeSchema.optional(),
});

export const getAssessmentsByClassSchema = z.object({
  classId: idString("Class ID"),
});

export const studentAssessmentIdSchema = z.object({
  studentId: idString("Student ID"),
});

export const checkDailyLimitSchema = z.object({
  assessmentType: assessmentTypeSchema,
});

export const recentAssessmentsSchema = z.object({
  schoolYear: optionalTrimmedString(),
});

const answerValueSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z.string()
);

const comprehensionAnswerSchema = z.object({
  questionId: idString("questionId"),
  answer: answerValueSchema,
});

export const comprehensionSubmitSchema = z.object({
  studentId: idString("studentId").optional(),
  passageId: idString("passageId").optional(),
  assessmentId: idString("assessmentId").optional(),
  answers: z.array(comprehensionAnswerSchema),
}).superRefine((data, ctx) => {
  if (data.assessmentId) return;

  if (!data.studentId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["studentId"],
      message: "studentId is required when assessmentId is not provided.",
    });
  }

  if (!data.passageId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["passageId"],
      message: "passageId is required when assessmentId is not provided.",
    });
  }
});

export const oralReadingComprehensionSubmitSchema = z.object({
  assessmentId: idString("assessmentId"),
  answers: z
    .array(comprehensionAnswerSchema)
    .min(1, "Missing required fields: assessmentId, answers"),
});

export const shareableAssessmentTokenSchema = z.object({
  token: requiredString("Assessment token"),
});

export const oralReadingResultIdSchema = z.object({
  oralReadingResultId: idString("Oral Reading Result ID"),
});
