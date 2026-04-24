import { prisma } from "@/lib/prisma";

export async function getOralFluencyMiscues(sessionId: string) {
  const miscues = await prisma.oralFluencyMiscue.findMany({
    where: { sessionId },
    orderBy: { wordIndex: "asc" },
  });

  return miscues;
}
