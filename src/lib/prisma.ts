import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const PRISMA_CLIENT_SCHEMA_VERSION = "2026-06-29-class-model-rename";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: string | undefined;
};

function getPrismaClient() {
  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaSchemaVersion === PRISMA_CLIENT_SCHEMA_VERSION &&
    "class" in globalForPrisma.prisma
  ) {
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect().catch(() => undefined);
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  const client = new PrismaClient({ adapter });

  globalForPrisma.prisma = client;
  globalForPrisma.prismaSchemaVersion = PRISMA_CLIENT_SCHEMA_VERSION;
  return client;
}

export const prisma = getPrismaClient();
