// next.config.ts
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
  ],
};

export default nextConfig;