import { PrismaClient } from "../generated/prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// For local development
if (process.env.NODE_ENV !== "production") {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaNeon({ connectionString });
  const client = new PrismaClient({ adapter });

  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();