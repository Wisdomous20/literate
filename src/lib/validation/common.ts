import { z } from "zod";

function coerceString(value: unknown) {
  return typeof value === "string" ? value : "";
}
function coerceOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export const requiredString = (label: string) =>
  z.preprocess(
    coerceString,
    z.string().trim().min(1, `${label} is required`)
  );

export const requiredUntrimmedString = (label: string) =>
  z.preprocess(coerceString, z.string().min(1, `${label} is required`));

export const optionalTrimmedString = () =>
  z.preprocess(coerceOptionalString, z.string().trim().min(1).optional());

export const idString = (label: string) => requiredString(label);

export const nonNegativeInt = (label: string) =>
  z.coerce.number().int().min(0, `${label} must be 0 or greater`);

export const positiveInt = (label: string) =>
  z.coerce.number().int().positive(`${label} must be greater than 0`);

export const optionalBoolean = () => z.boolean().optional();

export const passwordString = (label = "Password") =>
  requiredUntrimmedString(label).pipe(
    z.string().min(8, `${label} must be at least 8 characters long`)
  );

export const emailString = (label = "Email") =>
  requiredString(label).pipe(z.string().email("Invalid email format"));

export const fileSchema = (label: string) =>
  z.custom<File>((value) => isFile(value), {
    message: `${label} is required`,
  });

export const optionalUrlString = (label: string) =>
  z.preprocess(
    coerceOptionalString,
    z
      .string()
      .trim()
      .url(`${label} must be a valid URL`)
      .optional()
      .or(z.literal(""))
  );

export const isoDateString = (label: string) =>
  requiredString(label).refine(
    (value) => !Number.isNaN(Date.parse(value)),
    `${label} must be a valid date`
  );

export function getFirstZodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

export function getZodFieldErrors(error: z.ZodError): Record<string, string> {
  return error.issues.reduce<Record<string, string>>((fieldErrors, issue) => {
    const [field] = issue.path;

    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }

    return fieldErrors;
  }, {});
}
