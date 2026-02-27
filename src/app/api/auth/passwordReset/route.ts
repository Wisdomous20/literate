import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createPasswordResetToken } from "@/service/auth/resetPassword"
import { sendPasswordResetEmail } from "@/service/notification/sendPasswordResetEmail"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: "If an account with that email exists, a password reset link has been sent.",
      })
    }

    // Rate limiting: check if a token was created recently (within last 2 minutes)
    const recentToken = await prisma.passwordResetToken.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 1000),
        },
      },
    })

    if (recentToken) {
      return NextResponse.json({
        message: "If an account with that email exists, a password reset link has been sent.",
      })
    }

    // Generate token and send email
    const token = await createPasswordResetToken(normalizedEmail)
    await sendPasswordResetEmail(normalizedEmail, token)

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    )
  }
}