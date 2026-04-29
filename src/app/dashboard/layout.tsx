import { Sidebar } from "@/components/sidebar/sidebar";
import { OnboardingGuide } from "@/components/onboarding/onboardingGuide";
import { OnboardingTour } from "@/components/onboarding/onboardingTour";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#6e55fd]">
      <div className="relative z-30">
        <Sidebar />
      </div>
      <main className="relative z-20 -ml-1 flex-1 overflow-hidden rounded-[50px_0_0_50px] bg-white md:-ml-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-4 w-4 bg-white md:-left-5 md:w-5 lg:-left-6 lg:w-6"
        />
        {children}
      </main>
      <OnboardingTour />
      <OnboardingGuide />
    </div>
  );
}
