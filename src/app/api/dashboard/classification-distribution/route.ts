import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { classificationDistributionQuerySchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import {
  getClassificationDistribution,
  type AssessmentTypeFilter,
  type TestTypeFilter,
} from "@/service/dashboard/getClassificationDistribution";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validationResult = classificationDistributionQuerySchema.safeParse({
      schoolYear: searchParams.get("schoolYear"),
      assessmentType: searchParams.get("assessmentType") ?? undefined,
      testType: searchParams.get("testType") ?? undefined,
    });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: getFirstZodErrorMessage(validationResult.error) },
        { status: 400 }
      );
    }
    const { schoolYear, assessmentType, testType } = validationResult.data;

    const distribution = await getClassificationDistribution(
      session.user.id,
      schoolYear,
      assessmentType as AssessmentTypeFilter,
      testType as TestTypeFilter
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
