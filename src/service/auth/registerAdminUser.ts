import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { RegisterUserInput, RegisterErrorCode } from "@/types/auth";

interface RegisterAdminResult {
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

export async function registerAdminUser(input: RegisterUserInput): Promise<RegisterAdminResult> {
  const { firstName, lastName, email, password } = input;

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    return {
      success: false,
      error: "Name, email, and password are required",
      code: "VALIDATION_ERROR",
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "Invalid email format",
      code: "VALIDATION_ERROR",
    };
  }

  // Validate password strength
  if (password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters long",
      code: "VALIDATION_ERROR",
    };
  }

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
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin user with ADMIN role set directly
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isVerified: true, // Admins are pre-verified
      role: "ADMIN", // Set role to ADMIN
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