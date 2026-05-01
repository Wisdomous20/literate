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
      <div className="relative z-30 shrink-0">
        <Sidebar />
      </div>
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[50px_0_0_50px] bg-white">
        {children}
      </main>
      <OnboardingTour />
      <OnboardingGuide />
    </div>
  );
}
