import { z } from "zod";
import {
  idString,
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

const assessmentTypeFilterValues = [
  "ALL",
  ...assessmentTypeValues,
] as const;

const testTypeFilterValues = ["PRE", "POST"] as const;

export const classificationDistributionQuerySchema = z.object({
  schoolYear: requiredString("schoolYear"),
  assessmentType: z.enum(assessmentTypeFilterValues).optional().default("ALL"),
  testType: z.enum(testTypeFilterValues).optional().default("PRE"),
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
  studentId: idString("studentId"),
  passageId: idString("passageId"),
  answers: z.array(comprehensionAnswerSchema),
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
