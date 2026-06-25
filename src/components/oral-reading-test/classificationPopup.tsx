"use client";

import Image from "next/image";
import { X } from "lucide-react";

interface ClassificationPopupProps {
  classificationLevel: string;
  studentName: string;
  onClose: () => void;
  score?: string;
  assessmentType?: "oral-reading" | "comprehension" | "fluency";
}

const LEVEL_CONFIG: Record<
  string,
  {
    iconSrc: string;
    iconAlt: string;
    message: string;
    cloudBorder: string;
    cloudBg: string;
    accent: string;
  }
> = {
  INDEPENDENT: {
    iconSrc: "/Independent.svg",
    iconAlt: "Independent bee logo",
    message: "Read it alone",
    cloudBorder: "border-[#22C55E]",
    cloudBg: "bg-[#F0FDF4]",
    accent: "text-[#2e7d32]",
  },
  INSTRUCTIONAL: {
    iconSrc: "/Instructional.svg",
    iconAlt: "Instructional bee logo",
    message: "A little help",
    cloudBorder: "border-[#3B82F6]",
    cloudBg: "bg-[#EFF6FF]",
    accent: "text-[#27348B]",
  },
  FRUSTRATION: {
    iconSrc: "/Frustrated.svg",
    iconAlt: "Frustration bee logo",
    message: "Needs more practice",
    cloudBorder: "border-[#EF4444]",
    cloudBg: "bg-[#FEF2F2]",
    accent: "text-[#B91C1C]",
  },
};

export function ClassificationPopup({
  classificationLevel,
  studentName,
  onClose,
}: ClassificationPopupProps) {
  const config =
    LEVEL_CONFIG[classificationLevel.toUpperCase()] ||
    LEVEL_CONFIG.INSTRUCTIONAL;

  const firstName = studentName.trim().split(" ")[0] || "Reader";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="relative mx-4 flex w-full max-w-md flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-20 rounded-full bg-white/95 p-1.5 text-[#6666FF]/70 shadow-[0_8px_18px_rgba(39,52,139,0.2)] transition-colors hover:text-[#6666FF]"
          aria-label="Close popup"
          title="Close popup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex w-full flex-col items-center">
          <div
            className={`relative w-full max-w-90 rounded-[42px] border-3 px-6 py-5 text-center shadow-[0_14px_34px_rgba(17,24,39,0.14)] ${config.cloudBg} ${config.cloudBorder}`}
          >
            <p className="text-sm font-bold text-[#27348B]">
              Well done, {firstName}!
            </p>
            <p className={`mt-1 text-xs font-extrabold uppercase tracking-[0.08em] ${config.accent}`}>
              {classificationLevel.charAt(0) +
                classificationLevel.slice(1).toLowerCase()} Level
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#27348B]/85">
              {config.message}
            </p>

            <div
              className={`absolute -bottom-4 left-1/2 h-7 w-7 -translate-x-1/2 rotate-45 rounded-[6px] border-r-3 border-b-3 ${config.cloudBorder} ${config.cloudBg}`}
            />
          </div>

          <div className="relative mt-4 rounded-full bg-white/85 p-2 shadow-[0_16px_30px_rgba(39,52,139,0.2)]">
            <Image
              src={config.iconSrc}
              alt={config.iconAlt}
              width={138}
              height={138}
              className="h-28 w-28 object-contain sm:h-32 sm:w-32"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
