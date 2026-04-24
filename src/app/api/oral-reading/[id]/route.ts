import { NextRequest, NextResponse } from "next/server";
import { createAssessmentService } from "@/service/assessment/createAssessmentService";
import { prisma } from "@/lib/prisma";
import { transcriptionQueue } from "@/lib/queues";
import type { TranscriptionJobData } from "@/lib/queues";
import { createAudioAssessmentSchema } from "@/lib/validation/media";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const validationResult = createAudioAssessmentSchema.safeParse({
      studentId: formData.get("studentId"),
      passageId: formData.get("passageId"),
      audio: formData.get("audio"),
      audioUrl: formData.get("audioUrl") ?? undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: getFirstZodErrorMessage(validationResult.error) },
        { status: 400 },
      );
    }

    const { studentId, passageId, audio: audioFile, audioUrl = "" } =
      validationResult.data;

    // 1. Create assessment
    const assessmentResult = await createAssessmentService({
      studentId,
      passageId,
      type: "ORAL_READING",
    });

    if (!assessmentResult.success || !assessmentResult.assessment) {
      return NextResponse.json(
        { error: assessmentResult.error || "Failed to create assessment" },
        { status: 400 },
      );
    }

    const assessmentId = assessmentResult.assessment.id;

    // 2. Create PENDING session
    const session = await prisma.oralFluencySession.create({
      data: {
        assessmentId,
        audioUrl,
        status: "PENDING",
      },
    });

    // 3. Enqueue transcription
    const jobData: TranscriptionJobData = {
      assessmentId,
      audioUrl,
      fileName: audioFile.name || "recording.wav",
    };

    await transcriptionQueue.add(
      `transcribe-${assessmentId}`,
      jobData,
      { jobId: `transcription-${assessmentId}` },
    );

    console.log(`[API:oral-reading] Enqueued transcription for ${assessmentId}`);

    // 4. Return immediately
    return NextResponse.json(
      {
        assessmentId,
        sessionId: session.id,
        status: "PENDING",
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("Error creating oral reading session:", error);
    return NextResponse.json(
      { error: "Failed to create oral reading session" },
      { status: 500 },
    );
  }
}
