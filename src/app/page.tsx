import { LoginForm } from "@/components/auth/loginForm"
import { BrandPanel } from "@/components/auth/brandPanel"

export default function LoginPage() {
  return (
    <main 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/images/Login.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Semi-transparent overlay - increased darkness */}
      <div className="absolute inset-0 bg-black/85"></div>
      
      {/* Form Container - Pops out over the background */}
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="grid lg:grid-cols-2">
          {/* Left Panel - Brand */}
          <BrandPanel />
          
          {/* Right Panel - Login Form */}
          <div className="flex items-center justify-center p-8 lg:p-12 bg-[#7a7afb] rounded-r-3xl">
            <div className="w-full max-w-sm">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}