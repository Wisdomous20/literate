import { ForgotPasswordForm } from "@/components/auth/forgotPasswordForm"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f4fcfd] to-[#e8f8ff] p-4">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}