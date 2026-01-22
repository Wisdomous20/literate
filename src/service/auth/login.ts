import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  error?: string;
  code?: "INVALID_CREDENTIALS" | "EMAIL_NOT_VERIFIED" | "USER_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function loginUser(input: LoginUserInput): Promise<LoginResult> {
  const { email, password } = input;

  // Validate required fields
  if (!email || !password) {
    return {
      success: false,
      error: "Email and password are required",
      code: "INVALID_CREDENTIALS",
    };
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        isVerified: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Invalid email or password",
        code: "USER_NOT_FOUND",
      };
    }

    // Check password
    if (!user.password) {
      return {
        success: false,
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return {
        success: false,
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      };
    }

    // Check if email is verified
    if (!user.isVerified) {
      return {
        success: false,
        error: "Please verify your email before logging in",
        code: "EMAIL_NOT_VERIFIED",
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "An error occurred during login",
      code: "INTERNAL_ERROR",
    };
  }
}