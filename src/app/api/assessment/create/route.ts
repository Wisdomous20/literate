import { NextRequest, NextResponse } from "next/server";
import { createAssessmentService } from "@/service/assessment/createAssessmentService";
import { createAssessmentSchema } from "@/lib/validation/assessment";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import {
  getCurrentUser,
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

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await hasStudentAccess(studentId, currentUser.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await createAssessmentService({
      userId: currentUser.id,
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
