"use client";

import Image from "next/image";
import { FileText } from "lucide-react";

interface WelcomeSectionProps {
  teacherName: string;
  schoolYear: string;
  planType?: string;
}

export function WelcomeSection({
  teacherName,
  schoolYear,
  planType = "Free User Plan",
}: WelcomeSectionProps) {
  return (
    <div className="relative overflow-visible rounded-2xl border-r-4 border-b-4 border-[#5D5DFB] bg-white min-h-35 shadow-lg shadow-[#5D5DFB]/10 font-poppins">
      <div className="absolute inset-0 rounded-3xl overflow-hidden z-0">
        <Image
          src="/images/Clouds.jpg"
          alt="Cloud background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-transparent via-transparent to-purple-300/20 pointer-events-none z-10" />

      <div className="flex items-center justify-between p-4 md:p-8 min-h-45 relative z-20">
        <div className="flex-1 z-20">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#00306E] mb-2">
            Welcome Teacher {teacherName}!
          </h2>
          <p className="text-lg font-medium text-[#5D5DFB] mb-4">
            S.Y {schoolYear}
          </p>
          <div className="flex items-center gap-2 text-gray-600">
            <FileText className="h-5 w-5" />
            <span className="text-base font-normal">{planType}</span>
          </div>
        </div>

        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-80 h-80 md:w-96 md:h-96 shrink-0 -mr-8 z-30">
          <div className="absolute inset-0  from-white/10 via-transparent to-transparent rounded-full blur-lg z-10" />
          <Image
            src="/images/bee.png"
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