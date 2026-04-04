"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

export function SessionMonitor() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshTokenExpired") {
      signOut({ callbackUrl: "/login?expired=true" });
    }
  }, [session?.error]);

  return null;
}