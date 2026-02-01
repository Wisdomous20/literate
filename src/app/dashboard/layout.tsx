import { Sidebar } from "@/components/sidebar/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div 
      className="flex min-h-screen"
      style={{ backgroundColor: "#6666FF" }}
    >
      <Sidebar />
      <main 
        className="flex-1 overflow-auto"
        style={{
          backgroundColor: "#E4F4FF",
          borderRadius: "50px 0 0 50px"
        }}
      >
        {children}
      </main>
    </div>
  )
}
