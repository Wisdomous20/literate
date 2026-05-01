import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getGoogleCloudAuthOptions } from "../googleCloudAuth";

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(),
  },
}));

const GOOGLE_ENV_KEYS = [
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_CLOUD_PROJECT_ID",
  "GOOGLE_CLOUD_CLIENT_EMAIL",
  "GOOGLE_CLOUD_PRIVATE_KEY",
];

describe("getGoogleCloudAuthOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.existsSync).mockReturnValue(false);

    for (const key of GOOGLE_ENV_KEYS) {
      delete process.env[key];
    }
  });

  it("prefers an existing GOOGLE_APPLICATION_CREDENTIALS file", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = "/secrets/sa-key.json";
    process.env.GOOGLE_CLOUD_PROJECT_ID = "project-id";
    process.env.GOOGLE_CLOUD_CLIENT_EMAIL = "stale@example.iam.gserviceaccount.com";
    process.env.GOOGLE_CLOUD_PRIVATE_KEY = "stale-key";

    expect(getGoogleCloudAuthOptions()).toEqual({
      projectId: "project-id",
      keyFilename: "/secrets/sa-key.json",
    });
  });

  it("uses env service-account credentials when no key file is available", () => {
    process.env.GOOGLE_CLOUD_PROJECT_ID = "project-id";
    process.env.GOOGLE_CLOUD_CLIENT_EMAIL = "local@example.iam.gserviceaccount.com";
    process.env.GOOGLE_CLOUD_PRIVATE_KEY = "line-1\\nline-2";

    expect(getGoogleCloudAuthOptions()).toEqual({
      projectId: "project-id",
      credentials: {
        client_email: "local@example.iam.gserviceaccount.com",
        private_key: "line-1\nline-2",
      },
    });
  });

  it("falls back to application default credentials", () => {
    process.env.GOOGLE_CLOUD_PROJECT_ID = "project-id";

    expect(getGoogleCloudAuthOptions()).toEqual({
      projectId: "project-id",
    });
  });
});
