import { z } from "zod";
import {
  idString,
  optionalBoolean,
  optionalTrimmedString,
  requiredString,
} from "@/lib/validation/common";

const classNameSchema = requiredString("Class name")
  .pipe(z.string().min(2, "Class name must be at least 2 characters."))
  .pipe(z.string().max(50, "Class name must be 50 characters or fewer."))
  .pipe(
    z
      .string()
      .regex(
        /^[a-zA-Z0-9 _-]+$/,
        "Class name can only contain letters, numbers, spaces, hyphens, and underscores."
      )
  );

export const createClassSchema = z.object({
  name: classNameSchema,
  userId: requiredString("User ID"),
});

export const createStudentSchema = z.object({
  name: requiredString("Student name").pipe(
    z.string().max(50, "Student name must be 50 characters or fewer")
  ),
  level: z.coerce.number().int().positive(),
  userId: requiredString("User ID"),
  className: classNameSchema,
  schoolYear: requiredString("School year"),
});

export const updateClassSchema = z
  .object({
    userId: idString("User ID"),
    classRoomId: idString("Class ID"),
    name: optionalTrimmedString(),
    archived: optionalBoolean(),
  })
  .refine(
    (data) => data.name !== undefined || data.archived !== undefined,
    {
      message: "Nothing to update",
      path: ["classRoomId"],
    }
  );

export const deleteClassSchema = z.object({
  userId: idString("User ID"),
  classRoomId: idString("Class ID"),
});

export const getClassByIdSchema = z.object({
  classRoomId: idString("Class ID"),
});

export const getClassListSchema = z.object({
  userId: idString("User ID"),
  schoolYear: requiredString("School year"),
});

export const updateStudentSchema = z
  .object({
    userId: idString("User ID"),
    studentId: idString("Student ID"),
    name: optionalTrimmedString(),
    level: z.coerce.number().int().positive().optional(),
  })
  .refine((data) => data.name !== undefined || data.level !== undefined, {
    message: "Nothing to update",
    path: ["studentId"],
  });

export const deleteStudentSchema = z.object({
  userId: idString("User ID"),
  studentId: idString("Student ID"),
});

export const getStudentByIdSchema = z.object({
  userId: idString("User ID"),
  studentId: idString("Student ID"),
});

export const getStudentsByClassNameSchema = z.object({
  userId: idString("User ID"),
  className: classNameSchema,
});
