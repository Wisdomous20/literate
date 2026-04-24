import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { registerUserSchema } from "@/lib/validation/auth";
import { RegisterUserInput, RegisterErrorCode } from "@/types/auth";

interface RegisterUserResult {
  success: boolean;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    createdAt: Date;
  };
  error?: string;
  code?: RegisterErrorCode;
}


export async function registerUser(input: RegisterUserInput): Promise<RegisterUserResult> {
  const validationResult = registerUserSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
      code: "VALIDATION_ERROR",
    };
  }

  const { firstName, lastName, email, password } = validationResult.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      success: false,
      error: "User with this email already exists",
      code: "USER_EXISTS",
    };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password,10)

  // Create user
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isVerified: false,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
    },
  });

  return { success: true, user };
}
