import { z } from "zod";
import {
  passwordString,
  requiredString,
  requiredUntrimmedString,
} from "@/lib/validation/common";

const nameSchema = (label: string) =>
  requiredString(label).pipe(
    z.string().max(50, `${label} must be 50 characters or fewer`)
  );

const emailSchema = requiredString("Email").pipe(
  z.string().email("Invalid email format")
);

const verificationCodeSchema = requiredString("Verification code").pipe(
  z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit code.")
);

export const registerUserSchema = z.object({
  firstName: nameSchema("First name"),
  lastName: nameSchema("Last name"),
  email: emailSchema,
  password: passwordString(),
});

export const registerUserFormSchema = registerUserSchema
  .extend({
    confirmPassword: z.preprocess(
      (value) => (typeof value === "string" ? value : ""),
      z.string().min(1, "Please confirm your password.")
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginUserSchema = z.object({
  email: requiredString("Email"),
  password: requiredUntrimmedString("Password"),
});

export const verifyCodeInputSchema = z.object({
  userId: requiredString("User ID"),
  code: verificationCodeSchema,
});

export const resendVerificationCodeSchema = z.object({
  userId: requiredString("User ID"),
});

export const requestPasswordChangeSchema = z.object({
  currentPassword: requiredUntrimmedString("Current password"),
});

export const confirmPasswordChangeSchema = z.object({
  code: verificationCodeSchema,
  newPassword: passwordString("New password"),
});

export const resetPasswordSchema = z.object({
  token: requiredString("Token"),
  password: passwordString(),
});

export const resetPasswordFormSchema = z
  .object({
    password: passwordString(),
    confirmPassword: z.preprocess(
      (value) => (typeof value === "string" ? value : ""),
      z.string().min(1, "Please confirm your password.")
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
