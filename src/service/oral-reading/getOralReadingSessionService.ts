import { prisma } from "@/lib/prisma"


export async function getOralReadingSession(sessionId: string) {
  return prisma.oralReadingSession.findUnique({
    where: { id: sessionId },
    include: {
      miscues: { orderBy: { wordIndex: "asc" } },
      behaviors: true,
      wordTimestamps: { orderBy: { index: "asc" } },
      assessment: {
        include: {
          passage: true,
          student: { select: { id: true, name: true } },
        },
      },
    },
  })
}