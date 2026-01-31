import { SignupForm } from "@/components/auth/signup-form"
import { BrandPanel } from "@/components/auth/brand-panel"

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#effdff] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="grid lg:grid-cols-2">
          {/* Signup Form - Left Side */}
          <div className="p-8 lg:p-12 bg-[#f4fcfd]">
            <SignupForm />
          </div>
          {/* Brand Panel - Right Side */}
          <BrandPanel />
        </div>
      </div>
    </main>
  )
}
