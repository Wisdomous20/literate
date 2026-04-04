import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getDailyLimitStatus } from "@/service/assessment/checkDailyLimitService";

export const dynamic = "force-dynamic";

/**
 * Returns the current user's daily assessment usage and remaining limits.
 * Paid users get unlimited (Infinity serialized as -1 in JSON).
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const status = await getDailyLimitStatus(session.user.id);

    // Serialize Infinity as -1 for JSON compatibility
    const serialize = (val: number) => (val === Infinity ? -1 : val);

    return NextResponse.json({
      success: true,
      isFreeUser: status.isFreeUser,
      usage: status.usage,
      limits: {
        ORAL_READING: serialize(status.limits.ORAL_READING),
        COMPREHENSION: serialize(status.limits.COMPREHENSION),
        READING_FLUENCY: serialize(status.limits.READING_FLUENCY),
      },
      remaining: {
        ORAL_READING: serialize(status.remaining.ORAL_READING),
        COMPREHENSION: serialize(status.remaining.COMPREHENSION),
        READING_FLUENCY: serialize(status.remaining.READING_FLUENCY),
      },
    });
  } catch (error) {
    console.error("Error checking daily limit:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check daily limit" },
      { status: 500 }
    );
  }
}