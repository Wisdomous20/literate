import { Storage } from "@google-cloud/storage";

const client_email = process.env.GOOGLE_CLOUD_CLIENT_EMAIL ?? "";
const raw_key = process.env.GOOGLE_CLOUD_PRIVATE_KEY ?? "";
const private_key = raw_key.replace(/\\n/g, "\n");

const credentials =
  client_email && private_key ? { client_email, private_key } : undefined;

export const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  ...(credentials ? { credentials } : {}),
});

export const GCS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET ?? "cpuliterate-v2";
