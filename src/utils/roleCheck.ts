import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { userType } from "@/generated/prisma/enums";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(requiredRole: userType) {
  const session = await requireAuth();
  if (session.user.role !== requiredRole) {
    throw new Error("Forbidden");
  }
  return session;
}