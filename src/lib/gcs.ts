import { Storage } from "@google-cloud/storage";
import fs from "fs";

function createStorage(): Storage {
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (keyFile && fs.existsSync(keyFile)) {
    const keyData = JSON.parse(fs.readFileSync(keyFile, "utf8"));
    return new Storage({
      projectId: keyData.project_id,
      credentials: {
        client_email: keyData.client_email,
        private_key: keyData.private_key,
      },
    });
  }

  const credentials = {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL ?? "",
    private_key: (process.env.GOOGLE_CLOUD_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  };
  return new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials,
  });
}

export const storage = createStorage();
export const GCS_BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET ?? "cpuliterate";