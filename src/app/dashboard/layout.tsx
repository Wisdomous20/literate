import { Sidebar } from "@/components/sidebar/sidebar";
import { OnboardingGuide } from "@/components/onboarding/onboardingGuide";
import { OnboardingTour } from "@/components/onboarding/onboardingTour";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#6666FF]">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#ffffff] rounded-[50px_0_0_50px]">
        {children}
      </main>
      <OnboardingTour />
      <OnboardingGuide />
    </div>
  );
}
