import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

interface RegisterUserResult {
  success: boolean;
  user?: {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
  };
  error?: string;
}

export async function registerUser(input: RegisterUserInput): Promise<RegisterUserResult> {
  const { name, email, password } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: "User with this email already exists" };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      isVerified: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return { success: true, user };
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
