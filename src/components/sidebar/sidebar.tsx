"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  ClipboardList,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const menuItems = [
  {
    label: "My Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Oral Reading Test",
    href: "/dashboard/oral-reading-test",
    icon: FileText,
  },
  {
    label: "Reading Fluency Test",
    href: "/dashboard/reading-fluency",
    icon: BookOpen,
  },
  {
    label: "Reading Comprehension Test",
    href: "/dashboard/reading-comprehension",
    icon: ClipboardList,
  },
]

const generalItems = [
  {
    label: "Settings",
    href: "/dashboard/settings-page",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)

  // Get user's first name from session
  const firstName = session?.user?.name?.split(" ")[0] || "User"

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/login" })
  }

  return (
    <aside
      className="relative flex h-screen flex-col transition-all duration-300"
      style={{
        width: collapsed ? "80px" : "260px",
        minWidth: collapsed ? "80px" : "260px",
        backgroundColor: "#6666FF",
        boxShadow: "4px 0 20px rgba(102, 102, 255, 0.3)",
      }}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#6666FF] shadow-md transition-colors hover:bg-gray-100"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Logo */}
      <div
        className={cn("flex items-center gap-3 pt-6 pb-2", collapsed ? "justify-center px-2" : "px-8")}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
          >
            <path
              d="M16 4L6 10V22L16 28L26 22V10L16 4Z"
              fill="white"
            />
            <path
              d="M16 4L6 10M16 4L26 10M16 4V16M6 10V22L16 28M6 10L16 16M26 10V22L16 28M26 10L16 16M16 28V16"
              stroke="#6666FF"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        {!collapsed && (
          <span
            className="text-xl font-bold text-white"
            style={{ letterSpacing: "0.02em" }}
          >
            LiteRate
          </span>
        )}
      </div>

      {/* User Greeting */}
      {!collapsed ? (
        <div className="px-8 pt-4 pb-4">
          <h2 className="text-lg font-semibold text-white">Hi, Teacher {firstName}!</h2>
          <p className="text-sm text-white/70">S.Y 2026-2027</p>
        </div>
      ) : (
        <div className="pt-4 pb-4" />
      )}

      {/* Menu Section */}
      <div className={cn("flex-1", collapsed ? "px-3" : "px-6")}>
        {!collapsed && (
          <p
            className="mb-3 px-2 text-[11px] font-semibold text-white/90"
            style={{ letterSpacing: "0.25em" }}
          >
            MENU
          </p>
        )}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-200",
                  collapsed ? "justify-center px-0" : "px-2",
                  isActive
                    ? "text-white"
                    : "text-white/90 hover:text-white"
                )}
                style={isActive ? {
                  backgroundColor: "rgba(93, 93, 251, 0.6)",
                } : undefined}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#5D5DFB" }}
                >
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                {!collapsed && <span className="text-[13px]">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Divider */}
        <div
          className={cn("my-5", collapsed ? "mx-1" : "mx-2")}
          style={{
            height: "1px",
            backgroundColor: "rgba(255, 255, 255, 0.3)",
          }}
        />

        {/* General Section */}
        {!collapsed && (
          <p
            className="mb-3 px-2 text-[11px] font-semibold text-white/90"
            style={{ letterSpacing: "0.25em" }}
          >
            GENERAL
          </p>
        )}
        <nav className="space-y-1">
          {generalItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-200",
                  collapsed ? "justify-center px-0" : "px-2",
                  isActive
                    ? "text-white"
                    : "text-white/90 hover:text-white"
                )}
                style={isActive ? {
                  backgroundColor: "rgba(93, 93, 251, 0.6)",
                } : undefined}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#5D5DFB" }}
                >
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                {!collapsed && <span className="text-[13px]">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Divider */}
      <div
        className={collapsed ? "mx-3" : "mx-8"}
        style={{
          height: "1px",
          backgroundColor: "rgba(255, 255, 255, 0.3)",
        }}
      />

      {/* Logout */}
      <div className={cn("p-6", collapsed && "flex justify-center")}>
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout Account" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-white/90 transition-all duration-200 hover:text-white",
            collapsed ? "justify-center w-auto" : "w-full"
          )}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "#5D5DFB" }}
          >
            <LogOut className="h-4 w-4 text-white" />
          </div>
          {!collapsed && <span className="text-[13px]">Logout Account</span>}
        </button>
      </div>
    </aside>
  )
}