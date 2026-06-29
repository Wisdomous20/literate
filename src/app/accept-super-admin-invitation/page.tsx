import { Suspense } from "react";
import { SuperAdminInvitationForm } from "@/components/auth/superAdminInvitationForm";

export default function AcceptSuperAdminInvitationPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,198,254,0.28),transparent_28%),linear-gradient(180deg,#F8FBFE_0%,#EAF2FF_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,1fr)]">
          <section className="hidden lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2453A6]">
              LiteRate platform workspace
            </p>
            <h1 className="mt-4 max-w-md text-4xl font-bold tracking-tight text-[#0F2744]">
              Administer LiteRate with full platform access.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#575E6B]">
              Super admins can manage users, organizations, passage content,
              billing visibility, and platform access from the admin console.
            </p>
          </section>
          <Suspense
            fallback={
              <div className="rounded-[28px] border border-[#D9E5F5] bg-white/95 p-8 text-center text-sm font-medium text-[#575E6B] shadow-[0_24px_70px_rgba(50,55,67,0.12)]">
                Loading invitation...
              </div>
            }
          >
            <SuperAdminInvitationForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
