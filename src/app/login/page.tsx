import { Suspense } from "react";
import { LoginForm } from "@/components/auth/loginForm";
import { BrandPanel } from "@/components/auth/brandPanel";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FBF8FF] px-4 py-10 text-[#323743] sm:px-6">
      <div className="absolute inset-0 -z-10 bg-[url('/assets/IMG_2.svg')] bg-cover bg-center opacity-[0.16]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(108,78,235,0.20),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(255,93,162,0.16),transparent_26%),radial-gradient(circle_at_74%_86%,rgba(93,220,255,0.14),transparent_28%)]" />
      <div className="auth-orb auth-orb-slow absolute left-[-180px] top-[-180px] -z-10 h-[420px] w-[420px] rounded-full bg-[#DCD5FF] blur-3xl" />
      <div className="auth-orb auth-orb-medium absolute bottom-[-220px] right-[-160px] -z-10 h-[460px] w-[460px] rounded-full bg-[#FFE1F0] blur-3xl" />

      <div className="w-full max-w-5xl">
        <BrandPanel>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </BrandPanel>
      </div>
    </main>
  );
}
