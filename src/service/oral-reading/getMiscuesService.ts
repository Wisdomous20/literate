import { prisma } from "@/lib/prisma";

export async function getOralReadingMiscues(sessionId: string) {
  const miscues = await prisma.oralReadingMiscue.findMany({
    where: { sessionId },
    orderBy: { wordIndex: "asc" },
  });

  return miscues;
}