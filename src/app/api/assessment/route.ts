import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, type } = body

    if (!studentId || !type) {
      return NextResponse.json(
        { error: "studentId and type are required" },
        { status: 400 }
      )
    }

    const assessment = await prisma.assessment.create({
      data: {
        studentId,
        type,
      },
    })

    return NextResponse.json(assessment, { status: 201 })
  } catch (error) {
    console.error("Error creating assessment:", error)
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    const assessments = await prisma.assessment.findMany({
      where: studentId ? { studentId } : undefined,
      include: {
        oralReading: {
          include: {
            miscues: true,
            behaviors: true,
          },
        },
        comprehension: true,
        student: { select: { id: true, name: true } },
      },
      orderBy: { dateTaken: "desc" },
    })

    return NextResponse.json(assessments)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    )
  }
}