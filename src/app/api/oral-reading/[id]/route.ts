import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeOralReading } from "@/service/oral-reading/analysisService";

function serializeError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}`;
  }
  try {
    const str = JSON.stringify(err);
    if (str && str !== "{}") return str;
  } catch {}
  return String(err);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export const maxDuration = 60; // allow up to 60 seconds for Whisper processing

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const studentId = formData.get("studentId") as string;
    const passageId = formData.get("passageId") as string;
    const audioFile = formData.get("audio") as File;

    if (!studentId || !passageId || !audioFile) {
      return NextResponse.json(
        { error: "studentId, passageId, and audio file are required" },
        { status: 400 }
      );
    }

    const passage = await prisma.passage.findUnique({
      where: { id: passageId },
    });

    if (!passage) {
      return NextResponse.json(
        { error: "Passage not found" },
        { status: 404 }
      );
    }

    const session = await prisma.oralReadingSession.create({
      data: {
        studentId,
        passageId,
        status: "PROCESSING",
      },
    });

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    try {
      // Pass passage.language into analysis
      const analysis = await analyzeOralReading(
        audioBuffer,
        audioFile.name || "recording.webm",
        passage.content,
        passage.language
      );

      // ...existing transaction code to save results...
      await prisma.$transaction(async (tx) => {
        await tx.oralReadingSession.update({
          where: { id: session.id },
          data: {
            transcript: analysis.transcript,
            wordsPerMinute: analysis.wordsPerMinute,
            accuracy: analysis.accuracy,
            totalWords: analysis.totalWords,
            totalMiscues: analysis.totalMiscues,
            duration: analysis.duration,
            status: "COMPLETED",
          },
        });

        const timestampData = analysis.alignedWords
          .filter((w) => w.spoken && w.timestamp !== null)
          .map((w, index) => ({
            sessionId: session.id,
            word: w.spoken!,
            startTime: w.timestamp!,
            endTime: w.endTimestamp ?? w.timestamp!,
            confidence: w.confidence,
            index,
          }));

        if (timestampData.length > 0) {
          await tx.wordTimestamp.createMany({ data: timestampData });
        }

        if (analysis.miscues.length > 0) {
          await tx.oralReadingMiscue.createMany({
            data: analysis.miscues.map((m) => ({
              sessionId: session.id,
              miscueType: m.miscueType,
              expectedWord: m.expectedWord,
              spokenWord: m.spokenWord,
              wordIndex: m.wordIndex,
              timestamp: m.timestamp,
              isSelfCorrected: m.isSelfCorrected,
            })),
          });
        }

        if (analysis.behaviors.length > 0) {
          await tx.oralReadingBehavior.createMany({
            data: analysis.behaviors.map((b) => ({
              sessionId: session.id,
              behaviorType: b.behaviorType,
              startIndex: b.startIndex,
              endIndex: b.endIndex,
              startTime: b.startTime,
              endTime: b.endTime,
              notes: b.notes,
            })),
          });
        }
      });

      return NextResponse.json(
        { sessionId: session.id, status: "COMPLETED", analysis },
        { status: 201 }
      );
    } catch (analysisError) {
      const errorMsg = serializeError(analysisError);
      console.error("Analysis failed:", errorMsg, analysisError);
      try {
        await prisma.oralReadingSession.update({
          where: { id: session.id },
          data: { status: "FAILED" },
        });
      } catch (updateErr) {
        console.error("Failed to update session status:", updateErr);
      }
      return NextResponse.json(
        { error: errorMsg, sessionId: session.id },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMsg = serializeError(error);
    console.error("Error creating session:", errorMsg, error);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}