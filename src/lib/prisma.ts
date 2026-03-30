import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  const client = new PrismaClient({ adapter });

  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();