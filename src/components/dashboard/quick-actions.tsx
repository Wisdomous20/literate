"use client"

import { FileText, BookOpen, ClipboardList } from "lucide-react"
import Link from "next/link"

const actions = [
  {
    title: "Oral Reading Test",
    description: "Assess your students overall reading level",
    href: "/dashboard/oral-reading",
    icon: FileText,
  },
  {
    title: "Reading Fluency Test",
    description: "Assess your students reading fluency level",
    href: "/dashboard/reading-fluency",
    icon: BookOpen,
  },
  {
    title: "Reading Comprehension Test",
    description: "Assess your students reading comprehension level",
    href: "/dashboard/reading-comprehension",
    icon: ClipboardList,
  },
]

export function QuickActions() {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Start Assessment Now!</p>
      </div>
      <div className="space-y-3">
        {actions.map((action) => (
          <div
            key={action.title}
            className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/30 p-4"
          >
            <div className="flex items-start gap-3">
              <action.icon className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h4 className="font-semibold text-primary">{action.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </div>
            <Link
              href={action.href}
              className="rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Start Now
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
