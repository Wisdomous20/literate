import { userType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function updateAdminUserRoleService(
  targetUserId: string,
  role: userType,
  requestedByUserId: string
) {
  if (targetUserId === requestedByUserId) {
    return {
      success: false,
      error: "You cannot change your own role from the admin console.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!user) {
    return { success: false, error: "User not found." };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { role },
  });

  return {
    success: true,
    message: "User role updated.",
  };
}
