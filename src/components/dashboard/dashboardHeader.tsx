"use client"

import { LayoutDashboard } from "lucide-react"

interface DashboardHeaderProps {
  title: string
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  return (
    <header className="flex h-[80px] items-center border-b border-primary/20 bg-card/80 px-8 shadow-md shadow-accent/20">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold text-[#31318A]">{title}</h1>
      </div>
    </header>
  )
}
