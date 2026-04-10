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
    <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0px_0px_20px_1px_rgba(84,164,255,0.35)]">
      {/* Background decoration */}
      <div 
        className="absolute top-0 right-0 w-full h-full opacity-60"
        style={{
          backgroundImage: "url('/images/top-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      />
      
      <div className="relative flex flex-col md:flex-row items-center justify-between p-4 md:p-6 gap-4">
        {/* Text content */}
        <div className="flex-1 z-10">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#00306E] mb-2">
            Welcome Teacher {teacherName}!
          </h2>
          <p className="text-base md:text-lg font-bold text-[#00306E] mb-3">
            S.Y {schoolYear}
          </p>
          <div className="flex items-center gap-2 text-[#00306E]/70">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">{planType}</span>
          </div>
        </div>

        {/* Bee mascot */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 flex-shrink-0">
          <Image
            src="/images/bee.png"
            alt="LiteRate Bee Mascot"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
