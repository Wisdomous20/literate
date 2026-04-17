"use client";

import type { AssessmentTypeFilter } from "./assessmentFilterTabs";
import Image from "next/image";

interface WelcomeBoxProps {
  assessmentType: AssessmentTypeFilter;
}

const welcomeMessages: Record<AssessmentTypeFilter, string> = {
  ALL: "I'm here to help!",
  ORAL_READING: "Let's assess oral reading skills!",
  READING_FLUENCY: "Time to test reading fluency!",
  COMPREHENSION: "Ready to test comprehension?",
};

export function WelcomeBox({ assessmentType }: WelcomeBoxProps) {
  const message = welcomeMessages[assessmentType];

  return (
    <div className="relative h-48 rounded-2xl border border-[#9999FF]/25 shadow-[0_4px_16px_rgba(102,102,255,0.2)] overflow-hidden">
      {/* Background Image */}
      <Image
        src="/images/Class-bg.png"
        alt="Welcome background"
        fill
        className="object-cover"
      />

      {/* Content */}
      <div className="relative h-full flex flex-col items-start justify-between p-5 z-10">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white mb-1">
            Choose your reader!
          </h3>
          <p className="text-xs font-semibold text-white/80">{message}</p>
        </div>
      </div>

   <div className="absolute -bottom-8 right-0 z-30">
  <img
    src="/images/Class.png"
    alt="Bee mascot"
    width={180}
    height={180}
    className="object-contain"
  />
</div>
    </div>
  );
}