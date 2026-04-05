import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const link = await prisma.assessmentLink.findUnique({
      where: { token },
      select: { id: true, used: true },
    });

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Link not found." },
        { status: 404 }
      );
    }

    if (link.used) {
      return NextResponse.json(
        { success: true, message: "Already marked as used." },
        { status: 200 }
      );
    }

    await prisma.assessmentLink.update({
      where: { id: link.id },
      data: { used: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing assessment link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete assessment." },
      { status: 500 }
    );
  }
}