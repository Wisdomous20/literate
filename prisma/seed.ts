import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the Prisma seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const superAdminSeed = {
  email: "wisdomoustech@gmail.com",
  password: "Putchik12@",
  firstName: "Aljason",
  lastName: "Javier",
} as const;

async function seedSuperAdmin() {
  const existingUser = await prisma.user.findUnique({
    where: { email: superAdminSeed.email },
    select: {
      id: true,
      password: true,
    },
  });

  const hashedPassword = existingUser?.password
    ? undefined
    : await bcrypt.hash(superAdminSeed.password, 10);

  const user = existingUser
    ? await prisma.user.update({
        where: { email: superAdminSeed.email },
        data: {
          firstName: superAdminSeed.firstName,
          lastName: superAdminSeed.lastName,
          isVerified: true,
          isDisabled: false,
          role: "SUPER_ADMIN",
          ...(hashedPassword ? { password: hashedPassword } : {}),
        },
        select: {
          id: true,
          email: true,
        },
      })
    : await prisma.user.create({
        data: {
          firstName: superAdminSeed.firstName,
          lastName: superAdminSeed.lastName,
          email: superAdminSeed.email,
          password: hashedPassword ?? (await bcrypt.hash(superAdminSeed.password, 10)),
          isVerified: true,
          isDisabled: false,
          role: "SUPER_ADMIN",
        },
        select: {
          id: true,
          email: true,
        },
      });

  console.log(
    existingUser
      ? `Super admin ensured for ${user.email}. Existing password was preserved.`
      : `Super admin created for ${user.email}.`,
  );
}

seedSuperAdmin()
  .catch((error) => {
    console.error("Failed to seed super admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
