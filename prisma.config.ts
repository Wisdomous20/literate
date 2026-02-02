import "dotenv/config";
import { defineConfig } from "@prisma/internals";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Add your database URL here
    },
  },
});