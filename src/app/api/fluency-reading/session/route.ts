import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sessionIdQuerySchema } from "@/lib/validation/media";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const validationResult = sessionIdQuerySchema.safeParse({
      id: searchParams.get("id"),
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: getFirstZodErrorMessage(validationResult.error) },
        { status: 400 }
      )
    }

    const { id } = validationResult.data

    const session = await prisma.oralFluencySession.findUnique({
      where: { id },
      include: {
        miscues: { orderBy: { wordIndex: "asc" } },
        behaviors: true,
        wordTimestamps: { orderBy: { index: "asc" } },
        assessment: true,
      },
    })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    )
  }
}
