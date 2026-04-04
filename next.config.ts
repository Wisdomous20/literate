import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "bullmq",
    "ioredis",
    "@google-cloud/speech",
    "@google-cloud/storage",
    "pitchfinder",
    "bcrypt",
    "google-auth-library",
  ],
};

export default nextConfig;