import { ClassInventory } from "@/components/dashboard/class-inventory"
import { ClassificationChart } from "@/components/dashboard/classification-chart"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader title="My Dashboard" />
      
      <main className="flex-1 space-y-6 p-8">
        {/* Class Inventory Section */}
        <ClassInventory />

        {/* Charts and Quick Actions Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ClassificationChart />
          <QuickActions />
        </div>
      </main>
    </div>
  )
}
