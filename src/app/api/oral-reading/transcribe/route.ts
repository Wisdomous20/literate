import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transcriptionQueue } from "@/lib/queues";
import type { TranscriptionJobData } from "@/lib/queues";

export const maxDuration = 10; 

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const assessmentId = formData.get("assessmentId") as string;
    const audioFile = formData.get("audio") as File;
    const audioUrl = (formData.get("audioUrl") as string) || "";

    if (!assessmentId || !audioFile) {
      return NextResponse.json(
        { error: "assessmentId and audio file are required" },
        { status: 400 },
      );
    }

    // Validate assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { passage: { select: { content: true, language: true } } },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Create session as PENDING (or update existing)
    const existingSession = await prisma.oralFluencySession.findUnique({
      where: { assessmentId },
    });

    let sessionId: string;
    if (existingSession) {
      await prisma.oralFluencySession.update({
        where: { id: existingSession.id },
        data: { status: "PENDING", audioUrl },
      });
      sessionId = existingSession.id;
    } else {
      const session = await prisma.oralFluencySession.create({
        data: { assessmentId, audioUrl, status: "PENDING" },
      });
      sessionId = session.id;
    }

    // Enqueue the heavy work to BullMQ
    const jobData: TranscriptionJobData = {
      assessmentId,
      audioUrl,
      fileName: audioFile.name || "recording.wav",
    };

    const job = await transcriptionQueue.add(
      `transcribe-${assessmentId}`,
      jobData,
      { jobId: `transcription-${assessmentId}` },
    );

    console.log(`[API] Enqueued transcription job ${job.id} for assessment ${assessmentId}`);

    return NextResponse.json({
      success: true,
      assessmentId,
      sessionId,
      status: "PENDING",
      jobId: job.id,
    }, { status: 202 });
  } catch (error) {
    console.error("Transcription enqueue error:", error);
    return NextResponse.json(
      { error: "Failed to enqueue transcription" },
      { status: 500 },
    );
  }
}


export async function GET(request: NextRequest) {
  const assessmentId = request.nextUrl.searchParams.get("assessmentId");

  if (!assessmentId) {
    return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
  }

  const session = await prisma.oralFluencySession.findUnique({
    where: { assessmentId },
    include: {
      miscues: true,
      behaviors: true,
      wordTimestamps: { orderBy: { index: "asc" } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Still processing
  if (session.status === "PENDING" || session.status === "PROCESSING") {
    return NextResponse.json({
      status: session.status,
      assessmentId,
      sessionId: session.id,
    });
  }

  // Failed
  if (session.status === "FAILED") {
    return NextResponse.json({
      status: "FAILED",
      assessmentId,
      sessionId: session.id,
      error: "Transcription failed",
    });
  }

  // Completed — return full analysis
  return NextResponse.json({
    status: "COMPLETED",
    assessmentId,
    sessionId: session.id,
    analysis: {
      transcript: session.transcript,
      wordsPerMinute: session.wordsPerMinute,
      accuracy: session.accuracy,
      totalWords: session.totalWords,
      totalMiscues: session.totalMiscues,
      duration: session.duration,
      classificationLevel: session.classificationLevel,
      oralFluencyScore: session.oralFluencyScore,
      miscues: session.miscues.map((m) => ({
        miscueType: m.miscueType,
        expectedWord: m.expectedWord,
        spokenWord: m.spokenWord,
        wordIndex: m.wordIndex,
        timestamp: m.timestamp,
        isSelfCorrected: m.isSelfCorrected,
      })),
      behaviors: session.behaviors.map((b) => ({
        behaviorType: b.behaviorType,
        startIndex: b.startIndex,
        endIndex: b.endIndex,
        startTime: b.startTime,
        endTime: b.endTime,
        notes: b.notes,
      })),
      alignedWords: session.wordTimestamps.map((w) => ({
        spoken: w.word,
        timestamp: w.startTime,
        endTimestamp: w.endTime,
        confidence: w.confidence,
      })),
    },
  });
}