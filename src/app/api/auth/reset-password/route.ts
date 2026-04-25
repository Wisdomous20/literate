import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcrypt"
import { prisma } from "@/lib/prisma"
import { resetPasswordSchema } from "@/lib/validation/auth"
import { getFirstZodErrorMessage } from "@/lib/validation/common"
import {
  validatePasswordResetToken,
  deletePasswordResetToken,
} from "@/service/auth/validatePasswordResetService"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = resetPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: getFirstZodErrorMessage(validationResult.error) },
        { status: 400 }
      )
    }
    const { token, password } = validationResult.data

    const result = await validatePasswordResetToken(token)

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 12)

    await prisma.user.update({
      where: { email: result.email },
      data: { password: hashedPassword },
    })

    // Delete the used token
    await deletePasswordResetToken(token)

    return NextResponse.json({
      message: "Password has been reset successfully.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    )
  }
}
