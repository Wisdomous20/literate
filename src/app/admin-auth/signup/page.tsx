import { AdminSignupForm } from "@/components/admin-auth/adminSignupForm"
import { AdminBrandPanel } from "@/components/admin-auth/adminBrandPanel"

export default function AdminSignupPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: "#e4f4ff" }}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="grid lg:grid-cols-2">
          {/* Left Panel - Admin Brand */}
          <AdminBrandPanel />

          {/* Right Panel - Admin Signup Form */}
          <div className="flex items-center justify-center bg-white p-8 lg:p-12">
            <div className="w-full max-w-sm">
              <AdminSignupForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
