import { z } from "zod";
import { requiredString } from "@/lib/validation/common";

export const assessmentTypeValues = [
  "ORAL_READING",
  "COMPREHENSION",
  "READING_FLUENCY",
] as const;

export const assessmentTypeSchema = z.enum(assessmentTypeValues);

export const createAssessmentSchema = z.object({
  studentId: requiredString("studentId"),
  passageId: requiredString("passageId"),
  type: assessmentTypeSchema,
});

export const assessmentTypeFilterValues = [
  "ALL",
  ...assessmentTypeValues,
] as const;

export const testTypeFilterValues = ["PRE", "POST"] as const;

export const classificationDistributionQuerySchema = z.object({
  schoolYear: requiredString("schoolYear"),
  assessmentType: z.enum(assessmentTypeFilterValues).optional().default("ALL"),
  testType: z.enum(testTypeFilterValues).optional().default("PRE"),
});
