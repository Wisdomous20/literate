import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { storage, GCS_BUCKET } from "@/lib/gcs";
import { hasSessionAccess } from "@/lib/auth/assessmentAuthorization";
import { sessionIdQuerySchema } from "@/lib/validation/media";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { prisma } from "@/lib/prisma";
import { MAX_AUDIO_DOWNLOAD_BYTES } from "@/service/media/downloadTrustedAudio";
import { resolveStoredAudioObjectPath } from "@/lib/media/audioObjectPath";

export const runtime = "nodejs";

type ByteRange = { start: number; end: number };

function parseRange(range: string | null, size: number): ByteRange | null {
  if (!range) return { start: 0, end: size - 1 };
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match) return null;

  const [, startText, endText] = match;
  if (!startText && !endText) return null;

  if (!startText) {
    const suffixLength = Number(endText);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    return { start: Math.max(0, size - suffixLength), end: size - 1 };
  }

  const start = Number(startText);
  const end = endText ? Number(endText) : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return null;
  }

  return { start, end: Math.min(end, size - 1) };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const validationResult = sessionIdQuerySchema.safeParse({ id: sessionId });
  if (!validationResult.success) {
    return NextResponse.json(
      { error: getFirstZodErrorMessage(validationResult.error) },
      { status: 400 },
    );
  }

  if (!(await hasSessionAccess(validationResult.data.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await prisma.oralFluencyResult.findUnique({
    where: { id: validationResult.data.id },
    select: { audioUrl: true },
  });
  const objectPath = session?.audioUrl
    ? resolveStoredAudioObjectPath(session.audioUrl)
    : null;
  if (!objectPath) {
    return NextResponse.json({ error: "Audio not found" }, { status: 404 });
  }

  try {
    const file = storage.bucket(GCS_BUCKET).file(objectPath);
    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size);
    const contentType = metadata.contentType?.toLowerCase() ?? "";
    if (
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > MAX_AUDIO_DOWNLOAD_BYTES ||
      !contentType.startsWith("audio/")
    ) {
      return NextResponse.json({ error: "Audio not found" }, { status: 404 });
    }

    const byteRange = parseRange(request.headers.get("range"), size);
    if (!byteRange) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }

    const length = byteRange.end - byteRange.start + 1;
    const stream = file.createReadStream({
      start: byteRange.start,
      end: byteRange.end,
    });
    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
      "Content-Length": String(length),
      "Content-Type": contentType,
    });
    const hasRangeRequest = request.headers.has("range");
    if (hasRangeRequest) {
      headers.set("Content-Range", `bytes ${byteRange.start}-${byteRange.end}/${size}`);
    }

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: hasRangeRequest ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error("Private audio stream error:", error);
    return NextResponse.json(
      { error: "Failed to load audio" },
      { status: 500 },
    );
  }
}
