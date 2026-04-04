import { Storage } from "@google-cloud/storage";

const client_email = process.env.GOOGLE_CLOUD_CLIENT_EMAIL ?? "";
const raw_key = process.env.GOOGLE_CLOUD_PRIVATE_KEY ?? "";
const private_key = raw_key.replace(/\\n/g, "\n");

console.log(`[GCS] client_email: ${client_email}`);
console.log(`[GCS] raw key starts with: ${raw_key.substring(0, 30)}`);
console.log(`[GCS] raw key length: ${raw_key.length}`);
console.log(`[GCS] processed key starts with: ${private_key.substring(0, 30)}`);
console.log(`[GCS] processed key has real newlines: ${private_key.includes("\n")}`);
console.log(`[GCS] processed key has literal backslash-n: ${private_key.includes("\\n")}`);

const credentials = { client_email, private_key };

export const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials,
});

export const GCS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET ?? "cpuliterate-v2";