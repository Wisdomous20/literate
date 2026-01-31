import { Sidebar } from "@/components/sidebar/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto rounded-l-[50px] bg-background">
        {children}
      </main>
    </div>
  )
}
