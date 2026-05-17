import { prisma } from "@/lib/prisma";

export async function toggleAdminUserStatusService(
  targetUserId: string,
  disable: boolean,
  requestedByUserId: string
) {
  if (targetUserId === requestedByUserId) {
    return {
      success: false,
      error: "You cannot change your own enabled status from the admin console.",
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
    data: { isDisabled: disable },
  });

  return {
    success: true,
    message: disable ? "User disabled." : "User enabled.",
  };
}
