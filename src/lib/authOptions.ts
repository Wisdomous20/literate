import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { getRedis } from "./redis";
import { loginUser } from "@/service/auth/login";
import { userType } from "@/generated/prisma/enums";
import { randomBytes } from "crypto";

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_REMEMBER = 30 * 24 * 60 * 60; // 30 days
const REFRESH_TOKEN_TTL_DEFAULT = 2 * 60 * 60; // 2 hours

async function createRefreshToken(userId: string, rememberMe: boolean): Promise<string> {
  const redis = getRedis();
  const refreshToken = randomBytes(32).toString("hex");
  const ttl = rememberMe ? REFRESH_TOKEN_TTL_REMEMBER : REFRESH_TOKEN_TTL_DEFAULT;

  await redis.set(
    `refresh-token:${refreshToken}`,
    JSON.stringify({ userId, rememberMe }),
    "EX",
    ttl
  );

  return refreshToken;
}

async function validateRefreshToken(refreshToken: string) {
  const redis = getRedis();
  const data = await redis.get(`refresh-token:${refreshToken}`);

  if (!data) return null;

  return JSON.parse(data) as { userId: string; rememberMe: boolean };
}

async function rotateRefreshToken(oldToken: string, userId: string, rememberMe: boolean): Promise<string> {
  const redis = getRedis();
  // Delete old token
  await redis.del(`refresh-token:${oldToken}`);
  // Create new one
  return createRefreshToken(userId, rememberMe);
}

export async function invalidateRefreshToken(refreshToken: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`refresh-token:${refreshToken}`);
}

export const authOptions: NextAuthOptions = {
  debug: true,
  session: {
    strategy: "jwt",
    maxAge: ACCESS_TOKEN_MAX_AGE,
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
        const rememberMe = credentials.rememberMe === "true";

        // Create refresh token in Redis
        const refreshToken = await createRefreshToken(result.user.id, rememberMe);

        return {
          id: result.user.id,
          name: result.user.firstName + " " + result.user.lastName,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          role,
          rememberMe,
          refreshToken,
        } as User;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        const u = user as User & { rememberMe?: boolean; refreshToken?: string };
        token.id = user.id;
        token.role = user.role;
        token.rememberMe = u.rememberMe;
        token.refreshToken = u.refreshToken;
        token.accessTokenExpires = Date.now() + ACCESS_TOKEN_MAX_AGE * 1000;
        return token;
      }

      // Access token still valid
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token expired — try to refresh
      const refreshToken = token.refreshToken as string;
      if (!refreshToken) {
        // No refresh token, force re-login
        return { ...token, error: "RefreshTokenExpired" };
      }

      const refreshData = await validateRefreshToken(refreshToken);
      if (!refreshData) {
        // Refresh token expired or invalid
        return { ...token, error: "RefreshTokenExpired" };
      }

      // Fetch latest user data (role could have changed)
      const freshUser = await prisma.user.findUnique({
        where: { id: refreshData.userId },
        select: { role: true, isDisabled: true },
      });

      if (!freshUser || freshUser.isDisabled) {
        return { ...token, error: "RefreshTokenExpired" };
      }

      // Rotate refresh token for security
      const newRefreshToken = await rotateRefreshToken(
        refreshToken,
        refreshData.userId,
        refreshData.rememberMe
      );

      return {
        ...token,
        role: freshUser.role,
        refreshToken: newRefreshToken,
        accessTokenExpires: Date.now() + ACCESS_TOKEN_MAX_AGE * 1000,
        error: undefined,
      };
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as userType;

      // If refresh failed, signal the client
      if (token.error === "RefreshTokenExpired") {
        session.error = "RefreshTokenExpired";
      }

      return session;
    },
  },
  events: {
    signOut: async (message) => {
      // Clean up refresh token on logout
      if ("token" in message && message.token?.refreshToken) {
        await invalidateRefreshToken(message.token.refreshToken as string);
      }
    },
  },
};