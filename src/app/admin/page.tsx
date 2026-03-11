"use client";

import PassageInventory from "@/components/admin-dash/passages/passageInventory";

export default function AdminDashboard() {
  return (
    <div className="h-full min-h-screen w-full overflow-auto invisible-scrollbar">
      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <PassageInventory />
    </div>
  );
}
