import { LoginForm } from "@/components/auth/loginForm";
import { BrandPanel } from "@/components/auth/brandPanel";

export default function LoginPage() {
  return (
   <main className="main-auth-bg min-h-screen flex items-center justify-center p-6 relative">
  <div className="absolute inset-0 bg-black/85 pointer-events-none z-0" />
  <div className="relative w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden bg-[#6666FF] z-10">
    <BrandPanel>
      <LoginForm />
    </BrandPanel>
  </div>
</main>
  );
}