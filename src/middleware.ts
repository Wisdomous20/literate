import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isOrgRoute = pathname.startsWith("/org");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || isAdminRoute || isOrgRoute;
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // Not logged in → redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in → redirect away from auth pages
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Admin routes → only ADMIN role
  if (isAdminRoute && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Org management routes → only ORG_ADMIN role
  if (isOrgRoute && token?.role !== "ORG_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/org/:path*",
    "/login",
    "/register",
  ],
};