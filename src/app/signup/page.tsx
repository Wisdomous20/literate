import { SignupForm } from "@/components/auth/signupForm"
import { BrandPanel } from "@/components/auth/brandPanel"

export default function SignupPage() {
  return (
    <>
      <style>{`html, body { overflow: auto !important; height: auto !important; }`}</style>
      <main className="min-h-screen bg-[#effdff] flex justify-center py-8 px-4">
      <div className="w-full max-w-4xl self-start bg-white rounded-3xl shadow-xl overflow-hidden">
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
    </>
  )
}