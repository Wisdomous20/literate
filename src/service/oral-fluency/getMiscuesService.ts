import { prisma } from "@/lib/prisma";

export async function getOralFluencyMiscues(sessionId: string, userId?: string) {
  const miscues = await prisma.oralFluencyMiscue.findMany({
    where: {
      sessionId,
      ...(userId
        ? {
            oralFluencyResult: {
              assessment: {
                student: {
                  classRoom: {
                    userId,
                  },
                },
              },
            },
          }
        : {}),
    },
    orderBy: { wordIndex: "asc" },
  });

  return miscues;
}
