"use client"

import { LayoutDashboard } from "lucide-react"

interface DashboardHeaderProps {
  title: string
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  return (
    <header className="flex h-15 items-center border-b border-primary/20 bg-card/80 px-4 shadow-md shadow-accent/20 md:h-17.5 md:px-6 lg:h-20 lg:px-8">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-5 w-5 text-primary md:h-6 md:w-6" />
        <h1 className="text-xl font-semibold text-[#31318A] md:text-2xl">{title}</h1>
      </div>
    </header>
  )
}
