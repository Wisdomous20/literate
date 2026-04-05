import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const link = await prisma.assessmentLink.findUnique({
      where: { token },
      include: {
        assessment: {
          include: {
            student: { select: { id: true, name: true, level: true } },
            passage: {
              select: {
                id: true,
                title: true,
                content: true,
                language: true,
                level: true,
                testType: true,
                quiz: {
                  select: {
                    id: true,
                    questions: {
                      orderBy: { createdAt: "asc" },
                      select: {
                        id: true,
                        questionText: true,
                        tags: true,
                        type: true,
                        options: true,
                      },
                    },
                  },
                },
              },
            },
            comprehension: {
              select: { score: true, totalItems: true, classificationLevel: true },
            },
            oralFluency: {
              select: { status: true, classificationLevel: true },
            },
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Assessment link not found." },
        { status: 404 }
      );
    }

    // Check if used
    if (link.used) {
      return NextResponse.json(
        { success: false, error: "This assessment link has already been used." },
        { status: 410 }
      );
    }

    // Check if expired
    if (new Date() > link.expiresAt) {
      return NextResponse.json(
        { success: false, error: "This assessment link has expired." },
        { status: 410 }
      );
    }

    const { assessment } = link;

    // Check if assessment got completed (mark used if so)
    const isCompleted =
      (assessment.type === "COMPREHENSION" &&
        !!assessment.comprehension) ||
      (assessment.type === "READING_FLUENCY" &&
        assessment.oralFluency?.status === "COMPLETED") ||
      (assessment.type === "ORAL_READING" &&
        !!assessment.comprehension &&
        assessment.oralFluency?.status === "COMPLETED");

    if (isCompleted) {
      await prisma.assessmentLink.update({
        where: { id: link.id },
        data: { used: true },
      });

      return NextResponse.json(
        { success: false, error: "This assessment has already been completed." },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      type: assessment.type,
      expiresAt: link.expiresAt.toISOString(),
      student: assessment.student,
      passage: assessment.passage,
    });
  } catch (error) {
    console.error("Error resolving share token:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load assessment." },
      { status: 500 }
    );
  }
}