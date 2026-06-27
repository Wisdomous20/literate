import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sessionIdQuerySchema } from "@/lib/validation/media";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { hasSessionAccess } from "@/lib/auth/assessmentAuthorization";

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

    if (!(await hasSessionAccess(id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = await prisma.oralFluencyResult.findUnique({
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
