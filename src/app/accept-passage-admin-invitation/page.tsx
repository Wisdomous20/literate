import { Suspense } from "react";
import { PassageAdminInvitationForm } from "@/components/auth/passageAdminInvitationForm";

export default function AcceptPassageAdminInvitationPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(179,164,241,0.28),transparent_28%),linear-gradient(180deg,#FCFBFF_0%,#F3F0FF_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,1fr)]">
          <section className="hidden lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6C4EEB]">
              LiteRate content workspace
            </p>
            <h1 className="mt-4 max-w-md text-4xl font-bold tracking-tight text-[#323743]">
              Curate passages with focused admin access.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#575E6B]">
              Passage admins can manage passages, quizzes, and questions without
              access to users, organizations, billing, or platform settings.
            </p>
          </section>
          <Suspense
            fallback={
              <div className="rounded-[28px] border border-[#E1DDFB] bg-white/95 p-8 text-center text-sm font-medium text-[#575E6B] shadow-[0_24px_70px_rgba(50,55,67,0.12)]">
                Loading invitation...
              </div>
            }
          >
            <PassageAdminInvitationForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
