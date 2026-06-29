import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/utils/subscriptionCheck";

/**
 * Daily limits for free-tier users (no active subscription).
 * Each assessment type is capped at 1 per day.
 */

export const FREE_TIER_DAILY_LIMITS: Record<string, number> = {
  ORAL_READING: 1,
  COMPREHENSION: 1,
  READING_FLUENCY: 1,
};

/**
 * Resource caps for free-tier users (no active subscription). Paid users are
 * unlimited. Counting (not a bypass flag) keeps the registration default class
 * and the invited-user default class working (0 → 1).
 */
export const FREE_TIER_LIMITS = {
  MAX_CLASSES: 1,
  MAX_STUDENTS: 1,
} as const;

interface DailyUsage {
  ORAL_READING: number;
  COMPREHENSION: number;
  READING_FLUENCY: number;
}

interface CheckLimitResult {
  allowed: boolean;
  isFreeUser: boolean;
  usage: DailyUsage;
  limits: DailyUsage;
  reason?: string;
}

/**
 * Returns the start of today (midnight UTC) and end of today.
 */
function getTodayRange() {
  const now = new Date();
  const startOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  return { startOfDay, endOfDay };
}

/**
 * Get today's assessment usage for a user (across all their students).
 */
export async function getDailyUsage(userId: string): Promise<DailyUsage> {
  const { startOfDay, endOfDay } = getTodayRange();

  // Get all classes owned by this user
  const classes = await prisma.class.findMany({
    where: { userId },
    select: { id: true },
  });

  const classIds = classes.map((c) => c.id);

  if (classIds.length === 0) {
    return { ORAL_READING: 0, COMPREHENSION: 0, READING_FLUENCY: 0 };
  }

  // Count assessments by type created today for students in the user's classes
  const counts = await prisma.assessment.groupBy({
    by: ["type"],
    where: {
      student: {
        classId: { in: classIds },
      },
      dateTaken: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    _count: { id: true },
  });

  const usage: DailyUsage = {
    ORAL_READING: 0,
    COMPREHENSION: 0,
    READING_FLUENCY: 0,
  };

  for (const row of counts) {
    if (row.type in usage) {
      usage[row.type as keyof DailyUsage] = row._count.id;
    }
  }

  return usage;
}

/**
 * Check if a free-tier user can create a specific assessment type today.
 * Paid users always pass (allowed: true, isFreeUser: false).
 */
export async function checkDailyLimit(
  userId: string,
  assessmentType: string
): Promise<CheckLimitResult> {
  const limits: DailyUsage = {
    ORAL_READING: FREE_TIER_DAILY_LIMITS.ORAL_READING,
    COMPREHENSION: FREE_TIER_DAILY_LIMITS.COMPREHENSION,
    READING_FLUENCY: FREE_TIER_DAILY_LIMITS.READING_FLUENCY,
  };

  // Paid users have no daily limits
  const isPaid = await hasActiveSubscription(userId);
  if (isPaid) {
    const usage = await getDailyUsage(userId);
    return {
      allowed: true,
      isFreeUser: false,
      usage,
      limits: { ORAL_READING: Infinity, COMPREHENSION: Infinity, READING_FLUENCY: Infinity },
    };
  }

  // Free user — enforce limits
  const usage = await getDailyUsage(userId);
  const typeKey = assessmentType as keyof DailyUsage;
  const currentCount = usage[typeKey] ?? 0;
  const limit = limits[typeKey] ?? 0;

  if (currentCount >= limit) {
    return {
      allowed: false,
      isFreeUser: true,
      usage,
      limits,
      reason: `Daily limit reached for ${assessmentType.replace(/_/g, " ").toLowerCase()}. Free users can take ${limit} per day. Upgrade to a paid plan for unlimited assessments.`,
    };
  }

  return {
    allowed: true,
    isFreeUser: true,
    usage,
    limits,
  };
}

/**
 * Get the full daily usage status for a user (used by the frontend dashboard).
 */
export async function getDailyLimitStatus(userId: string) {
  const isPaid = await hasActiveSubscription(userId);
  const usage = await getDailyUsage(userId);

  if (isPaid) {
    return {
      isFreeUser: false,
      usage,
      limits: {
        ORAL_READING: Infinity,
        COMPREHENSION: Infinity,
        READING_FLUENCY: Infinity,
      },
      remaining: {
        ORAL_READING: Infinity,
        COMPREHENSION: Infinity,
        READING_FLUENCY: Infinity,
      },
    };
  }

  const limits: DailyUsage = {
    ORAL_READING: FREE_TIER_DAILY_LIMITS.ORAL_READING,
    COMPREHENSION: FREE_TIER_DAILY_LIMITS.COMPREHENSION,
    READING_FLUENCY: FREE_TIER_DAILY_LIMITS.READING_FLUENCY,
  };

  return {
    isFreeUser: true,
    usage,
    limits,
    remaining: {
      ORAL_READING: Math.max(0, limits.ORAL_READING - usage.ORAL_READING),
      COMPREHENSION: Math.max(0, limits.COMPREHENSION - usage.COMPREHENSION),
      READING_FLUENCY: Math.max(
        0,
        limits.READING_FLUENCY - usage.READING_FLUENCY
      ),
    },
  };
}

export interface ResourceLimitStatus {
  isFreeUser: boolean;
  classes: { count: number; max: number };
  students: { count: number; max: number };
}

/**
 * Class/student resource usage and caps for a user. Paid users get Infinity
 * caps; the frontend uses this to disable "Create class" / "Add student" and
 * show an upgrade CTA instead of failing on submit.
 */
export async function getResourceLimitStatus(
  userId: string
): Promise<ResourceLimitStatus> {
  const [isPaid, classCount, studentCount] = await Promise.all([
    hasActiveSubscription(userId),
    prisma.class.count({ where: { userId, archived: false } }),
    prisma.student.count({ where: { class: { userId } } }),
  ]);

  return {
    isFreeUser: !isPaid,
    classes: {
      count: classCount,
      max: isPaid ? Infinity : FREE_TIER_LIMITS.MAX_CLASSES,
    },
    students: {
      count: studentCount,
      max: isPaid ? Infinity : FREE_TIER_LIMITS.MAX_STUDENTS,
    },
  };
}
