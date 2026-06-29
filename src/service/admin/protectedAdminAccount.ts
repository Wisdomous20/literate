import { prisma } from "@/lib/prisma";
import { isSeededSuperAdminEmail } from "@/config/protectedAccounts";

export const SEEDED_SUPER_ADMIN_PROTECTION_MESSAGE =
  "The seeded super admin cannot have its role changed, be disabled, or be deleted.";

export async function isSeededSuperAdminUserId(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  return isSeededSuperAdminEmail(user?.email);
}
