"use client"

import { FileText, HelpCircle, BookOpen, Users } from "lucide-react"
import Link from "next/link"

const stats = [
  {
    label: "Total Passages",
    value: 48,
    icon: FileText,
    color: "#6666FF",
    bgColor: "rgba(102, 102, 255, 0.12)",
  },
  {
    label: "Comprehension Questions",
    value: 156,
    icon: HelpCircle,
    color: "#54A4FF",
    bgColor: "rgba(84, 164, 255, 0.12)",
  },
  {
    label: "Languages",
    value: 2,
    icon: BookOpen,
    color: "#2E8B57",
    bgColor: "rgba(46, 139, 87, 0.12)",
  },
  {
    label: "Active Teachers",
    value: 24,
    icon: Users,
    color: "#D4A017",
    bgColor: "rgba(212, 160, 23, 0.12)",
  },
]

const quickLinks = [
  {
    title: "Manage Graded Passages",
    description: "Create and manage standardized reading passages for assessments",
    href: "/superadmin/passages",
    icon: FileText,
  },
  {
    title: "Comprehension Questions",
    description: "Create and tag literal, inferential, or critical questions",
    href: "/superadmin/questions",
    icon: HelpCircle,
  },
]

export default function AdminDashboard() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header
        className="flex h-[118px] items-center px-10"
        style={{
          borderBottom: "1px solid #8D8DEC",
          boxShadow: "0px 4px 4px #54A4FF",
          background: "transparent",
          borderTopLeftRadius: "50px",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
          </div>
          <h1 className="text-[25px] font-semibold leading-[38px] text-[#31318A]">
            Admin Dashboard
          </h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-[20px] bg-white p-5"
              style={{
                boxShadow: "0px 0px 20px 1px rgba(84, 164, 255, 0.35)",
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: stat.bgColor }}
              >
                <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#00306E]/60">{stat.label}</p>
                <p className="text-3xl font-bold text-[#00306E]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="flex flex-col justify-between rounded-[20px] bg-white p-6 transition-all hover:scale-[1.01]"
              style={{
                boxShadow: "0px 0px 20px 1px rgba(84, 164, 255, 0.35)",
              }}
            >
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(102, 102, 255, 0.12)" }}
                  >
                    <link.icon className="h-5 w-5 text-[#6666FF]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#31318A]">{link.title}</h3>
                </div>
                <p className="text-sm text-[#00306E]/60">{link.description}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <span
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
                  style={{
                    background: "#2E2E68",
                    boxShadow: "0px 4px 15px rgba(46, 46, 104, 0.4)",
                  }}
                >
                  Manage
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
