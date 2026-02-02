import type { Metadata } from "next";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: "Literate",
  description: "Oral Reading Assessment Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}