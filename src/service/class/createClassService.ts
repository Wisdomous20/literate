import { prisma } from "@/lib/prisma";
import { getSchoolYear } from "@/utils/getSchoolYear";
import { hasActiveSubscription } from "@/utils/subscriptionCheck";
import { FREE_TIER_LIMITS } from "@/service/assessment/checkDailyLimitService";

interface CreateClassInput {
  name: string;
  userId: string;
}

interface CreateClassResult {
  success: boolean;
  class?: {
    id: string;
    name: string;
    userId: string;
    schoolYear: string;
  };
  error?: string;
  code?: "VALIDATION_ERROR" | "INTERNAL_ERROR" | "FREE_LIMIT_REACHED";
}

export async function createClassService(
  input: CreateClassInput
): Promise<CreateClassResult> {
  const { name, userId } = input;

  if (!name?.trim()) {
    return {
      success: false,
      error: "Class name is required",
      code: "VALIDATION_ERROR",
    };
  }

  if (!userId) {
    return {
      success: false,
      error: "User ID is required",
      code: "VALIDATION_ERROR",
    };
  }

  // Free-tier cap: at most MAX_CLASSES non-archived classes. Counting allows the
  // first class (0 → 1), so registration/invite bootstrap still succeeds.
  const isPaid = await hasActiveSubscription(userId);
  if (!isPaid) {
    const existingClasses = await prisma.class.count({
      where: { userId, archived: false },
    });
    if (existingClasses >= FREE_TIER_LIMITS.MAX_CLASSES) {
      return {
        success: false,
        error: "Free plan includes 1 class. Upgrade to add more.",
        code: "FREE_LIMIT_REACHED",
      };
    }
  }

  // Determine the school year based on the current date
  const schoolYear = getSchoolYear();
  try {
    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        userId,
        schoolYear,
      },
      select: {
        id: true,
        name: true,
        userId: true,
        schoolYear: true,
      },
    });

    return { success: true, class: newClass };
  } catch (error) {
    console.error("Failed to create class:", error);
    return {
      success: false,
      error: "Failed to create class",
      code: "INTERNAL_ERROR",
    };
  }
}
