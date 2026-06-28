import { prisma } from "@/lib/prisma";

export async function getShareableLinksService(userId: string) {
  try {
    const links = await prisma.assessmentLink.findMany({
      where: {
        assessment: {
          student: {
            classRoom: {
              userId,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        used: true,
        expiresAt: true,
        createdAt: true,
        assessment: {
          select: {
            id: true,
            type: true,
            student: { select: { id: true, name: true, level: true } },
            passage: { select: { id: true, title: true, level: true, testType: true } },
          },
        },
      },
    });

    return { success: true as const, links };
  } catch (error) {
    console.error("Failed to fetch shareable links:", error);
    return {
      success: false as const,
      error: "Failed to fetch shareable links.",
    };
  }
}