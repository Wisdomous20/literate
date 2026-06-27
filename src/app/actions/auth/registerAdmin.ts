"use server";

import { registerAdminUser } from "@/service/auth/registerAdminUser";
import { RegisterUserInput } from "@/types/auth";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { registerUserSchema } from "@/lib/validation/auth";
import { requireRole } from "@/utils/roleCheck";

export async function registerAdminAction(input: RegisterUserInput) {
  await requireRole("ADMIN");

  const validationResult = registerUserSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
      code: "VALIDATION_ERROR" as const,
    };
  }

  // Register admin user directly with ADMIN role
  const result = await registerAdminUser(validationResult.data);

  if (!result.success || !result.user) {
    return result;
  }

  return result;
}
