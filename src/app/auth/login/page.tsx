import { LoginForm } from "@/components/auth/loginForm"
import { BrandPanel } from "@/components/auth/brandPanel"

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#e4f4ff] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="grid lg:grid-cols-2">
          {/* Left Panel - Brand */}
          <BrandPanel />
          
          {/* Right Panel - Login Form */}
          <div className="flex items-center justify-center p-8 lg:p-12 bg-white">
            <div className="w-full max-w-sm">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}