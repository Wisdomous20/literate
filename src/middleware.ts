// import { getToken } from "next-auth/jwt";
// import { NextRequest, NextResponse } from "next/server";

// export async function middleware(request: NextRequest) {
//   const token = await getToken({ req: request });
//   const { pathname } = request.nextUrl;

//   // Define protected routes
//   const isAdminRoute = pathname.startsWith("/admin");
//   const isProtectedRoute = pathname.startsWith("/dashboard") || isAdminRoute;
//   const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

//   // Redirect unauthenticated users to login
//   if (isProtectedRoute && !token) {
//     return NextResponse.redirect(new URL("/login", request.url));
//   }

//   // Redirect authenticated users away from auth pages
//   if (isAuthRoute && token) {
//     return NextResponse.redirect(new URL("/dashboard", request.url));
//   }

//   // Restrict admin routes to ADMIN users only
//   if (isAdminRoute && token?.role !== "ADMIN") {
//     return NextResponse.redirect(new URL("/dashboard", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
// };

import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Temporarily bypass authentication - allow all routes
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};