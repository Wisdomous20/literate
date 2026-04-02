import { Storage } from "@google-cloud/storage";

const credentials = {
  client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL ?? "",
  private_key: (process.env.GOOGLE_CLOUD_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
};

export const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials,
});

export const GCS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET ?? "cpuliterate-v2";