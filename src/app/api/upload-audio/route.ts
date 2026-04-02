import { NextRequest, NextResponse } from "next/server";
import { storage, GCS_BUCKET } from "@/lib/gcs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filePath = formData.get("filePath") as string;

    if (!file || !filePath) {
      return NextResponse.json({ success: false, error: "Missing file or filePath" }, { status: 400 });
    }

    console.log(`[GCS] Uploading: ${filePath}, size: ${file.size}, type: ${file.type}`);
    console.log(`[GCS] Bucket: ${GCS_BUCKET}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = storage.bucket(GCS_BUCKET);
    const gcsFile = bucket.file(filePath);

    await new Promise<void>((resolve, reject) => {
      const stream = gcsFile.createWriteStream({
        resumable: false,
        contentType: file.type || "audio/wav",
        metadata: { cacheControl: "public, max-age=31536000" },
      });
      stream.on("error", reject);
      stream.on("finish", resolve);
      stream.end(buffer);
    });

    const url = `https://storage.googleapis.com/${GCS_BUCKET}/${filePath}`;
    console.log(`[GCS] Upload successful: ${filePath}`);

    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error("GCS upload error:", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}