import fs from "fs";

export interface GoogleCloudAuthOptions {
  projectId?: string;
  keyFilename?: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function normalizePrivateKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/\\n/g, "\n");
}

export function getGoogleCloudAuthOptions(): GoogleCloudAuthOptions {
  const projectId = envValue("GOOGLE_CLOUD_PROJECT_ID");
  const keyFilename = envValue("GOOGLE_APPLICATION_CREDENTIALS");

  if (keyFilename && fs.existsSync(keyFilename)) {
    return { projectId, keyFilename };
  }

  const clientEmail = envValue("GOOGLE_CLOUD_CLIENT_EMAIL");
  const privateKey = normalizePrivateKey(process.env.GOOGLE_CLOUD_PRIVATE_KEY);

  if (clientEmail && privateKey) {
    return {
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    };
  }

  return { projectId };
}
