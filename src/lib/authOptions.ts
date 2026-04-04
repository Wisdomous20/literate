import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { loginUser } from "@/service/auth/login";
import { userType } from "@/generated/prisma/enums";

export const authOptions: NextAuthOptions = {
  debug: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days (max, for "remember me")
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "Enter your email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
        rememberMe: {
          label: "Remember Me",
          type: "text",
        },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const result = await loginUser({
          email: credentials.email,
          password: credentials.password,
        });

        if (!result.success || !result.user) {
          throw new Error(result.error || "Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { id: result.user.id },
          select: { role: true },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const role = user.role as userType;

        return {
          id: result.user.id,
          name: result.user.firstName + " " + result.user.lastName,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          role,
          rememberMe: credentials.rememberMe === "true",
        } as User;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        const remember = (user as User & { rememberMe?: boolean }).rememberMe;

        if (remember) {
          // 30 days
          token.exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
        } else {
          // 24 hours — session effectively expires after a day
          token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.id as string;
      session.user.role = token.role as userType;
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  events: {
    signIn: async (message) => {
      console.log("User signed in:", message);
    },
    signOut: async (message) => {
      console.log("User signed out:", message);
    },
  },
};
