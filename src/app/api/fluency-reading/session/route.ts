import { NextRequest, NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await prisma.oralReadingSession.findUnique({
      where: { id },
      include: {
        passage: true,
        miscues: { orderBy: { wordIndex: "asc" } },
        behaviors: true,
        wordTimestamps: { orderBy: { index: "asc" } },
        student: { select: { id: true, name: true } },
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