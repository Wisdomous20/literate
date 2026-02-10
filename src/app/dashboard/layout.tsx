import { Sidebar } from "@/components/sidebar/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#6666FF]">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#E4F4FF] rounded-[50px_0_0_50px]">
        {children}
      </main>
    </div>
  );
}
