"use server";

import { registerAdminUser } from "@/service/auth/registerAdminUser";
import { RegisterUserInput } from "@/types/auth";

export async function registerAdminAction(input: RegisterUserInput) {
  // Register admin user directly with ADMIN role
  const result = await registerAdminUser(input);

  if (!result.success || !result.user) {
    return result;
  }

  return result;
}