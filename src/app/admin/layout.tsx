"use client";

import { signOut } from "next-auth/react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen bg-[#F4FCFD] flex flex-col">
      {/* Header */}
      <header className="w-full h-17.5 flex items-center px-10 border-b border-[#8D8DEC] bg-white shadow justify-between">
        <h1 className="text-xl font-bold text-[#31318A]">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="ml-auto rounded-lg bg-[#2E2E68] px-5 py-2 text-white font-semibold hover:bg-[#1a1a40] transition"
        >
          Logout
        </button>
      </header>
      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}