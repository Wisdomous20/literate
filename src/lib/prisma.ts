import { PrismaClient } from "../generated/prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// For local development
if (process.env.NODE_ENV !== "production") {
  neonConfig.webSocketConstructor = ws;
}

const connectionString = process.env.DATABASE_URL;

// Pass connection string directly to PrismaNeon
const adapter = new PrismaNeon({connectionString});

export const prisma = new PrismaClient({ adapter });