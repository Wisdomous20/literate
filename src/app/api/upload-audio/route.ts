import { NextRequest, NextResponse } from "next/server";
import fs from "fs";

const GCS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET ?? "cpuliterate-v2";

async function getAccessToken(): Promise<string> {
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile && fs.existsSync(keyFile)) {
    const keyData = JSON.parse(fs.readFileSync(keyFile, "utf8"));
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      credentials: {
        client_email: keyData.client_email,
        private_key: keyData.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token!;
  }
    const client_email = process.env.GOOGLE_CLOUD_CLIENT_EMAIL ?? "";
  const private_key = (process.env.GOOGLE_CLOUD_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

  if (client_email && private_key) {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      credentials: { client_email, private_key },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token!;
  }

  throw new Error("No credentials available");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filePath = formData.get("filePath") as string;

    if (!file || !filePath) {
      return NextResponse.json({ success: false, error: "Missing file or filePath" }, { status: 400 });
    }

    console.log(`[GCS] Uploading: ${filePath}, size: ${file.size}, type: ${file.type}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const token = await getAccessToken();

    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${GCS_BUCKET}/o?uploadType=media&name=${encodeURIComponent(filePath)}`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type || "audio/wav",
      },
      body: buffer,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[GCS] Upload failed:", response.status, error);
      return NextResponse.json({ success: false, error: `Upload failed: ${response.status}` }, { status: 500 });
    }

    const url = `https://storage.googleapis.com/${GCS_BUCKET}/${filePath}`;
    console.log(`[GCS] Upload successful: ${filePath}`);

    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error("GCS upload error:", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}