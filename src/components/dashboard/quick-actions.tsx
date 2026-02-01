"use client"

import { FileText } from "lucide-react"
import Link from "next/link"

const actions = [
  {
    title: "Oral Reading Test",
    description: "Assess your students overall reading level",
    href: "/dashboard/oral-reading",
  },
  {
    title: "Reading Fluency Test",
    description: "Assess your students reading fluency level",
    href: "/dashboard/reading-fluency",
  },
  {
    title: "Reading Comprehension Test",
    description: "Assess your students reading comprehension level",
    href: "/dashboard/reading-comprehension",
  },
]

export function QuickActions() {
  return (
    <div 
      className="flex h-full flex-col rounded-[20px] bg-white p-6"
      style={{
        boxShadow: "0px 0px 20px 1px rgba(84, 164, 255, 0.35)"
      }}
    >
      <div className="mb-4">
        <h3 className="text-[18px] font-semibold text-[#00306E]">Quick Actions</h3>
        <p className="text-sm text-[#00306E]/70">Start Assessment Now!</p>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3">
        {actions.map((action) => (
          <div
            key={action.title}
            className="flex flex-1 items-center justify-between rounded-[15px] px-5 py-4"
            style={{
              border: "1px solid rgba(0, 48, 110, 0.21)",
              background: "rgba(228, 244, 255, 0.3)"
            }}
          >
            <div className="flex items-start gap-4">
              <FileText className="mt-1 h-6 w-6 text-[#6666FF]" />
              <div>
                <h4 className="text-base font-semibold text-[#6666FF]">{action.title}</h4>
                <p className="text-sm text-[#00306E]/60">
                  {action.description}
                </p>
              </div>
            </div>
            <Link
              href={action.href}
              className="rounded-lg border border-[#00306E]/20 bg-white px-5 py-2.5 text-sm font-medium text-[#00306E] transition-colors hover:bg-[#E4F4FF]"
            >
              Start Now
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
