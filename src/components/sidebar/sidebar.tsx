"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  ClipboardList,
  Settings,
  LogOut,
} from "lucide-react"

const menuItems = [
  {
    label: "My Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Oral Reading Test",
    href: "/dashboard/oral-reading",
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
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-[280px] flex-col bg-primary text-primary-foreground">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
          >
            <path
              d="M16 2L4 8V24L16 30L28 24V8L16 2Z"
              fill="white"
              stroke="white"
              strokeWidth="2"
            />
            <path
              d="M16 2V30M4 8L28 24M28 8L4 24"
              stroke="#6666FF"
              strokeWidth="2"
            />
          </svg>
        </div>
        <span className="text-2xl font-bold tracking-wide">LiteRate</span>
      </div>

      {/* User Greeting */}
      <div className="px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Hi, Teacher A!</h2>
        <p className="text-sm text-white/80">S.Y 2026-2027</p>
      </div>

      {/* Menu Section */}
      <div className="flex-1 px-4">
        <p className="mb-2 px-2 text-xs font-semibold tracking-wider text-white/80">
          MENU
        </p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-white"
                    : "text-white/90 hover:bg-secondary/50"
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                  <item.icon className="h-4 w-4" />
                </div>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Divider */}
        <div className="my-4 h-px bg-white/30" />

        {/* General Section */}
        <p className="mb-2 px-2 text-xs font-semibold tracking-wider text-white/80">
          GENERAL
        </p>
        <nav className="space-y-1">
          {generalItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-white"
                    : "text-white/90 hover:bg-secondary/50"
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                  <item.icon className="h-4 w-4" />
                </div>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="border-t border-white/30 p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-secondary/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <LogOut className="h-5 w-5" />
          </div>
          <span>Logout Account</span>
        </button>
      </div>
    </aside>
  )
}
