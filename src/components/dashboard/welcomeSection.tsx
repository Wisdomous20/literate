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
    <div className="relative overflow-visible rounded-3xl bg-white shadow-[12px_12px_32px_rgba(102,102,255,0.25)] font-poppins">
      <div className="absolute inset-0 rounded-3xl overflow-hidden z-0">
        <Image
          src="/images/Clouds.jpg"
          alt="Cloud background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="absolute right-0 top-0 bottom-0 z-20 pointer-events-none flex flex-col">
        <div className="w-2 h-8 bg-[#6666FF] rounded-tr-3xl" />
        <div className="flex-1 w-2 bg-[#6666FF]" />
        <div className="w-2 h-8 bg-[#6666FF] rounded-br-3xl" />
      </div>
      {/* Bottom side */}
      <div className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none flex flex-row">
        <div className="h-2 w-8 bg-[#6666FF] rounded-bl-3xl" />
        <div className="flex-1 h-2 bg-[#6666FF]" />
        <div className="h-2 w-8 bg-[#6666FF] rounded-br-3xl" />
      </div>

      <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-transparent via-transparent to-purple-300/20 pointer-events-none z-10" />

      <div className="flex items-center justify-between p-4 md:p-8 min-h-45 relative z-20">
        {/* Text content */}
        <div className="flex-1 z-20">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-2">
            Welcome Teacher {teacherName}!
          </h2>
          <p className="text-lg font-medium text-purple-600 mb-4">
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