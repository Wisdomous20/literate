"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { SettingsProvider } from "@/context/settingsContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>{children}</SettingsProvider>
    </SessionProvider>
  );
}