import { NextRequest, NextResponse } from "next/server";
import { createAssessmentService } from "@/service/assessment/createAssessmentService";
import { createAssessmentSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import {
  getCurrentUserId,
  hasStudentAccess,
} from "@/lib/auth/assessmentAuthorization";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createAssessmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: getFirstZodErrorMessage(validationResult.error) },
        { status: 400 }
      );
    }
    const { studentId, passageId, type } = validationResult.data;

    const userId = await getCurrentUserId();
    if (!userId || !(await hasStudentAccess(studentId, userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await createAssessmentService({
      userId,
      studentId,
      passageId,
      type,
    });

    if (!result.success || !result.assessment) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || "Failed to create assessment" 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        assessment: result.assessment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating assessment:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create assessment" 
      },
      { status: 500 }
    );
  }
}
