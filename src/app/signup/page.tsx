import { SignupForm } from "@/components/auth/signupForm"
import { BrandPanel } from "@/components/auth/brandPanel"

export default function SignupPage() {
  return (
    <>
      <style>{`html, body { overflow: auto !important; height: auto !important; }`}</style>
      <main 
        className="min-h-screen flex justify-center py-8 px-4 relative"
        style={{
          backgroundImage: "url('/images/Login.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Very dark overlay */}
        <div className="absolute inset-0 bg-black/80"></div>
        
        {/* Form Container - Pops out over the background */}
        <div className="relative z-10 w-full max-w-4xl self-start bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Signup Form - Left Side */}
            <div className="p-8 lg:p-12 bg-[#7a7afb] rounded-l-3xl">
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