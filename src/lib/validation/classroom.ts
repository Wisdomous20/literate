import { z } from "zod";
import { requiredString } from "@/lib/validation/common";

export const classNameSchema = requiredString("Class name")
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
