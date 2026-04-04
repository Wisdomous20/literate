import { userType } from "@/generated/prisma/enums";
import { authOptions } from "@/lib/authOptions";
import NextAuth from "next-auth";

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: User;
    error?:string;
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    role: userType;
    hashPassword?: string;
    rememberMe?: boolean;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: userType;
    rememberMe?: boolean;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
