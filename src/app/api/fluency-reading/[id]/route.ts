import { NextRequest, NextResponse } from "next/server";
import { createAssessmentService } from "@/service/assessment/createAssessmentService";
import { prisma } from "@/lib/prisma";
import { transcriptionQueue } from "@/lib/queues";
import type { TranscriptionJobData } from "@/lib/queues";


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const studentId = formData.get("studentId") as string;
    const passageId = formData.get("passageId") as string;
    const audioFile = formData.get("audio") as File;
    const audioUrl = (formData.get("audioUrl") as string) || "";

    if (!studentId || !passageId || !audioFile) {
      return NextResponse.json(
        { error: "studentId, passageId, and audio file are required" },
        { status: 400 },
      );
    }

    // 1. Create assessment
    const assessmentResult = await createAssessmentService({
      studentId,
      passageId,
      type: "READING_FLUENCY",
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

    console.log(`[API:fluency-reading] Enqueued transcription for ${assessmentId}`);

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
    console.error("Error in fluency reading API:", error);
    return NextResponse.json(
      { error: "Failed to create reading fluency session" },
      { status: 500 },
    );
  }
}