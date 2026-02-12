import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { loginUser } from "@/service/auth/login";
import { userType } from "@/generated/prisma/enums";


export const authOptions: NextAuthOptions = {
  debug: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
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

        // Fetch the user's role from the database
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
  events: {
    signIn: async (message) => {
      console.log("User signed in:", message);
    },
    signOut: async (message) => {
      console.log("User signed out:", message);
    },
  },
};