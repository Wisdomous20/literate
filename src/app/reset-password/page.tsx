import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/resetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#f4fcfd] to-[#e8f8ff] p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center text-[#040029]/70">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}