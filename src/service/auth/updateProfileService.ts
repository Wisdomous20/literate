import { prisma } from "@/lib/prisma";

interface UpdateProfileInput {
  firstName: string;
  lastName: string;
}

export async function updateProfileService(
  userId: string,
  { firstName, lastName }: UpdateProfileInput,
) {
  const trimmedFirst = firstName?.trim() ?? "";
  const trimmedLast = lastName?.trim() ?? "";

  if (!userId) {
    return { success: false, error: "User ID is required" };
  }

  if (!trimmedFirst || !trimmedLast) {
    return { success: false, error: "First and last name are required" };
  }

  if (trimmedFirst.length > 60 || trimmedLast.length > 60) {
    return { success: false, error: "Name is too long" };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: trimmedFirst,
      lastName: trimmedLast,
    },
    select: { firstName: true, lastName: true },
  });

  return { success: true, user: updated };
}
