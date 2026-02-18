"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { LayoutDashboard, FileText, HelpCircle, Settings, LogOut } from "lucide-react";

const menuItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Graded Passages", href: "/admin/passages", icon: FileText },
  { label: "Comprehension Questions", href: "/admin/questions", icon: HelpCircle },
];

const generalItems = [{ label: "Settings", href: "/superadmin/settings", icon: Settings }];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login"); // redirect user to login page after logout
  };

  return (
    <aside className="relative flex h-screen w-[323px] min-w-[323px] flex-col bg-[#6666FF] shadow-[16px_18px_5px_3px_rgba(8,70,44,0.09)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-8 pt-6 pb-2">
        <div className="flex h-8 w-8 items-center justify-center">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
            <path d="M16 4L6 10V22L16 28L26 22V10L16 4Z" fill="white" />
            <path
              d="M16 4L6 10M16 4L26 10M16 4V16M6 10V22L16 28M6 10L16 16M26 10V22L16 28M26 10L16 16M16 28V16"
              stroke="#6666FF"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <span className="text-xl font-bold text-white tracking-[0.02em]">LiteRate</span>
      </div>

      {/* Admin Badge */}
      <div className="px-8 pt-4 pb-4">
        <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
        <p className="text-sm text-white/70">System Management</p>
      </div>

      {/* Menu Section */}
      <div className="flex-1 px-6">
        <p className="mb-3 px-2 text-[11px] font-semibold text-white/90 tracking-[0.25em]">MENU</p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200",
                  isActive ? "text-white" : "text-white/90 hover:text-white"
                )}
                style={isActive ? { backgroundColor: "rgba(93, 93, 251, 0.6)" } : undefined}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5D5DFB]">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-[13px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-2 my-5 h-px bg-white/30" />

        {/* General Section */}
        <p className="mb-3 px-2 text-[11px] font-semibold text-white/90 tracking-[0.25em]">GENERAL</p>
        <nav className="space-y-1">
          {generalItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200",
                  isActive ? "text-white" : "text-white/90 hover:text-white"
                )}
                style={isActive ? { backgroundColor: "rgba(93, 93, 251, 0.6)" } : undefined}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5D5DFB]">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-[13px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Divider */}
      <div className="mx-8 h-px bg-white/30" />

      {/* Logout */}
      <div className="p-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-white/90 transition-all duration-200 hover:text-white"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5D5DFB]">
            <LogOut className="h-4 w-4 text-white" />
          </div>
          <span className="text-[13px]">Logout Account</span>
        </button>
      </div>
    </aside>
  );
}