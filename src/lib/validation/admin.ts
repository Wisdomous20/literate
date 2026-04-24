import { z } from "zod";
import { testType } from "@/generated/prisma/enums";
import {
  idString,
  nonNegativeInt,
  optionalTrimmedString,
  positiveInt,
  requiredString,
} from "@/lib/validation/common";

const questionTagSchema = z.enum(["Literal", "Inferential", "Critical"]);
const questionTypeSchema = z.enum(["MULTIPLE_CHOICE", "ESSAY"]);
const passageTestTypeSchema = z.nativeEnum(testType);

const questionTextSchema = requiredString("Question text").pipe(
  z.string().max(1000, "Question text must be 1000 characters or fewer")
);

const optionStringSchema = requiredString("Option").pipe(
  z.string().max(255, "Option must be 255 characters or fewer")
);

const questionContentBaseSchema = z.object({
  questionText: questionTextSchema,
  tags: questionTagSchema,
});

const multipleChoiceFieldsSchema = z.object({
  type: z.literal("MULTIPLE_CHOICE"),
  options: z
    .array(optionStringSchema)
    .min(2, "Multiple choice questions require at least 2 options"),
  correctAnswer: requiredString("Correct answer"),
});

const essayFieldsSchema = z.object({
  type: z.literal("ESSAY"),
  options: z.array(optionStringSchema).optional(),
  correctAnswer: optionalTrimmedString(),
});

const multipleChoiceQuestionSchema = questionContentBaseSchema.extend(
  multipleChoiceFieldsSchema.shape
);

const essayQuestionSchema = questionContentBaseSchema.extend(
  essayFieldsSchema.shape
);

export const createPassageSchema = z.object({
  title: requiredString("Title").pipe(
    z.string().max(255, "Title must be 255 characters or fewer")
  ),
  content: requiredString("Content"),
  language: requiredString("Language").pipe(
    z.string().max(50, "Language must be 50 characters or fewer")
  ),
  level: nonNegativeInt("Level"),
  testType: passageTestTypeSchema,
});

export const updatePassageSchema = z
  .object({
    id: idString("Passage ID"),
    title: optionalTrimmedString(),
    content: optionalTrimmedString(),
    language: optionalTrimmedString(),
    level: nonNegativeInt("Level").optional(),
    testType: passageTestTypeSchema.optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.content !== undefined ||
      data.language !== undefined ||
      data.level !== undefined ||
      data.testType !== undefined,
    {
      message: "Nothing to update",
      path: ["id"],
    }
  );

export const deletePassageSchema = z.object({
  id: idString("Passage ID"),
});

const createQuestionContentSchema = z.discriminatedUnion("type", [
  multipleChoiceQuestionSchema,
  essayQuestionSchema,
]);

export const addQuestionSchema = z.discriminatedUnion("type", [
  multipleChoiceQuestionSchema.extend({
    passageId: idString("Passage ID"),
  }),
  essayQuestionSchema.extend({
    passageId: idString("Passage ID"),
  }),
]);

export const getQuestionByIdSchema = z.object({
  id: idString("Question ID"),
});

export const deleteQuestionSchema = z.object({
  id: idString("Question ID"),
});

export const updateQuestionSchema = z
  .object({
    id: idString("Question ID"),
    questionText: optionalTrimmedString(),
    tags: questionTagSchema.optional(),
    type: questionTypeSchema.optional(),
    options: z.array(optionStringSchema).optional(),
    correctAnswer: optionalTrimmedString(),
  })
  .superRefine((data, ctx) => {
    if (
      data.questionText === undefined &&
      data.tags === undefined &&
      data.type === undefined &&
      data.options === undefined &&
      data.correctAnswer === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["id"],
        message: "Nothing to update",
      });
    }

    if (data.type === "MULTIPLE_CHOICE") {
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message:
            "Options and correct answer are required for multiple choice questions.",
        });
      }
      if (!data.correctAnswer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctAnswer"],
          message:
            "Options and correct answer are required for multiple choice questions.",
        });
      }
    }
  });

const createQuizQuestionSchema = createQuestionContentSchema;

const createQuizQuestionWithOptionalIdSchema = z.discriminatedUnion("type", [
  multipleChoiceQuestionSchema.extend({
    id: z.undefined().optional(),
  }),
  essayQuestionSchema.extend({
    id: z.undefined().optional(),
  }),
]);

const updateQuizQuestionSchema = z
  .union([
    z.object({
      id: idString("Question ID"),
      questionText: optionalTrimmedString(),
      tags: questionTagSchema.optional(),
      type: questionTypeSchema.optional(),
      options: z.array(optionStringSchema).optional(),
      correctAnswer: optionalTrimmedString(),
    }),
    createQuizQuestionWithOptionalIdSchema,
  ])
  .superRefine((question, ctx) => {
    if (
      "type" in question &&
      question.type === "MULTIPLE_CHOICE" &&
      (!question.options || question.options.length < 2 || !question.correctAnswer)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Multiple choice questions require at least 2 options and a correctAnswer",
      });
    }
  });

export const createQuizSchema = z.object({
  passageId: idString("Passage ID"),
  totalScore: positiveInt("Total score"),
  totalNumber: positiveInt("Total number of questions"),
  questions: z
    .array(createQuizQuestionSchema)
    .min(1, "At least one question is required"),
});

export const updateQuizSchema = z.object({
  id: idString("Quiz ID"),
  totalScore: positiveInt("Total score").optional(),
  totalNumber: positiveInt("Total number of questions").optional(),
  questions: z.array(updateQuizQuestionSchema).optional(),
}).refine(
  (data) =>
    data.totalScore !== undefined ||
    data.totalNumber !== undefined ||
    data.questions !== undefined,
  {
    message: "Nothing to update",
    path: ["id"],
  }
);

export const getPassageByIdSchema = z.object({
  id: idString("Passage ID"),
});

export const getQuizByPassageSchema = z.object({
  passageId: idString("Passage ID"),
});
