import { AdminSidebar } from "@/components/admin-dash/adminSidebar";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#6666FF]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-[#E4F4FF] rounded-l-[50px]">
        {children}
      </main>
    </div>
  );
}
