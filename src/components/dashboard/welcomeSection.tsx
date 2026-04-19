"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Star, Info } from "lucide-react";
import { getSubscriptionAction } from "@/app/actions/subscription/getSubscription";
import { PLANS, type PlanKey } from "@/config/plans";

interface WelcomeSectionProps {
  teacherName: string;
  schoolYear: string;
}

export function WelcomeSection({
  teacherName,
  schoolYear,
}: WelcomeSectionProps) {
  const [plan, setPlan] = useState<{
    name: string;
    description?: string;
    isPremium: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkPlan = async () => {
      const res = await getSubscriptionAction();
      if (cancelled) return;

      if (
        res.success &&
        "subscription" in res &&
        res.subscription &&
        res.subscription.status === "ACTIVE"
      ) {
        const key = res.subscription.planType as PlanKey;
        const planObj = PLANS[key];
        if (planObj) {
          setPlan({
            name: `${planObj.name} Plan`,
            description: planObj.description,
            isPremium: true,
          });
          return;
        }
      }
      // If not premium or no plan found
      setPlan({
        name: "Free User Plan",
        isPremium: false,
      });
    };

    checkPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative overflow-visible rounded-2xl border-l border-t border-r-4 border-b-4 border-[#5D5DFB] bg-white min-h-35 shadow-lg shadow-[#5D5DFB]/10 font-poppins">
      {" "}
      {/* Cloud SVG Background */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden z-0">
        <Image
          src="/Cloud.svg"
          alt="Cloud background"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-transparent via-transparent to-purple-300/20 pointer-events-none z-10" />
      <div className="flex items-center justify-between p-4 md:p-8 min-h-45 relative z-20">
        <div className="flex-1 z-20">
          <h2 className="text-xl md:text-2xl font-semibold text-[#5D5DFB] mb-2">
            Welcome Teacher {teacherName}!
          </h2>
          <p className="text-base font-medium text-[#7B7BFF] mb-4">
            S.Y {schoolYear}
          </p>

          {plan && plan.isPremium ? (
            <div className="inline-flex items-center gap-3 rounded-xl bg-linear-to-r from-[#5D5DFB] to-[#8B5CF6] px-5 py-2 shadow-lg border-2 border-[#7B7BFF]/30">
              <Star className="h-5 w-5 text-yellow-300 drop-shadow" />
              <div className="flex flex-col">
                <span className="text-base font-bold text-white tracking-wide">
                  {plan.name}
                </span>
                <span className="text-xs text-white/80 font-medium">
                  {plan.description}
                </span>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-3 rounded-xl bg-[#EEF2FF] px-5 py-2 border border-[#5D5DFB]/30 shadow">
              <Info className="h-5 w-5 text-[#5D5DFB]" />
              <div className="flex flex-col">
                <span className="text-base font-semibold text-[#5D5DFB]">
                  {plan?.name ?? "Free User Plan"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-80 h-80 md:w-96 md:h-96 shrink-0 -mr-8 z-30">
          <div className="absolute inset-0 from-white/10 via-transparent to-transparent rounded-full blur-lg z-10" />
          <Image
            src="/Mascot.svg"
            alt="LiteRate Bee Mascot"
            fill
            className="object-contain drop-shadow-2xl z-20"
            priority
          />
        </div>
      </div>
    </div>
  );
}
