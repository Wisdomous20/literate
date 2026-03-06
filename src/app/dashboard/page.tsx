import { ClassInventory } from "@/components/dashboard/classInventory";
import { ClassificationChart } from "@/components/dashboard/classificationChart";
import { QuickActions } from "@/components/dashboard/quickActions";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="My Dashboard" />

      <main className="flex flex-1 flex-col gap-6 px-8 py-6">
        <ClassInventory />

        {/* Keep default stretch so both cards have equal height */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <ClassificationChart />
          <QuickActions />
        </div>
      </main>
    </div>
  );
}