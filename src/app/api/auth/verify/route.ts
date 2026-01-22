import { verifyUser } from "@/service/auth/verifyUser";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const userId = searchParams.get("userId");

  if (!token || !userId) {
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_parameters", req.url)
    );
  }

  const result = await verifyUser(token, userId);

  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${result.error?.toLowerCase()}`, req.url)
    );
  }

  return NextResponse.redirect(
    new URL("/auth/login?verified=true", req.url)
  );
}