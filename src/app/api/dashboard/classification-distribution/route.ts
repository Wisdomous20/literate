import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
  getClassificationDistribution,
  type AssessmentTypeFilter,
  type TestTypeFilter,
} from "@/service/dashboard/getClassificationDistribution";

export const dynamic = "force-dynamic";

const VALID_ASSESSMENT: AssessmentTypeFilter[] = [
  "ALL",
  "ORAL_READING",
  "READING_FLUENCY",
  "COMPREHENSION",
];
const VALID_TEST: TestTypeFilter[] = ["PRE", "POST"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get("schoolYear");
    const assessmentTypeRaw = searchParams.get("assessmentType") ?? "ALL";
    const testTypeRaw = searchParams.get("testType") ?? "PRE";

    if (!schoolYear) {
      return NextResponse.json(
        { error: "schoolYear is required" },
        { status: 400 }
      );
    }

    if (!VALID_ASSESSMENT.includes(assessmentTypeRaw as AssessmentTypeFilter)) {
      return NextResponse.json(
        { error: "Invalid assessmentType" },
        { status: 400 }
      );
    }
    if (!VALID_TEST.includes(testTypeRaw as TestTypeFilter)) {
      return NextResponse.json(
        { error: "Invalid testType" },
        { status: 400 }
      );
    }

    const distribution = await getClassificationDistribution(
      session.user.id,
      schoolYear,
      assessmentTypeRaw as AssessmentTypeFilter,
      testTypeRaw as TestTypeFilter
    );

    return NextResponse.json(distribution);
  } catch (error) {
    console.error("Error loading classification distribution:", error);
    return NextResponse.json(
      { error: "Failed to load classification distribution" },
      { status: 500 }
    );
  }
}
