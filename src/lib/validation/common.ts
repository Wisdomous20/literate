import { z } from "zod";

function coerceString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export const requiredString = (label: string) =>
  z.preprocess(
    coerceString,
    z.string().trim().min(1, `${label} is required`)
  );

export const requiredUntrimmedString = (label: string) =>
  z.preprocess(coerceString, z.string().min(1, `${label} is required`));

export const passwordString = (label = "Password") =>
  requiredUntrimmedString(label).pipe(
    z.string().min(8, `${label} must be at least 8 characters long`)
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
