import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getResourceLimitStatus } from "@/service/assessment/checkDailyLimitService";

export const dynamic = "force-dynamic";

/**
 * Returns the current user's class/student usage and caps. Paid users get
 * unlimited (Infinity serialized as -1 in JSON).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const status = await getResourceLimitStatus(session.user.id);

    // Serialize Infinity as -1 for JSON compatibility.
    const serialize = (val: number) => (val === Infinity ? -1 : val);

    return NextResponse.json({
      success: true,
      isFreeUser: status.isFreeUser,
      classes: { count: status.classes.count, max: serialize(status.classes.max) },
      students: { count: status.students.count, max: serialize(status.students.max) },
    });
  } catch (error) {
    console.error("Error checking resource limits:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check resource limits" },
      { status: 500 }
    );
  }
}
