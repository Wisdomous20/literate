import { Storage } from "@google-cloud/storage";

let storage: Storage;

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });
} else {
  // Fallback to env var credentials (local dev)
  const credentials = {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL ?? "",
    private_key: (process.env.GOOGLE_CLOUD_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  };
  storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials,
  });
}

export { storage };
export const GCS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET ?? "cpuliterate";