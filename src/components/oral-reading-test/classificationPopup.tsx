"use client";

import { X } from "lucide-react";
import Image from "next/image";

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
    label: string;
    message: string;
    badge: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
    mascot: string;
  }
> = {
  INDEPENDENT: {
    label: "Independent Reader",
    message:
      "Amazing! You can read this all on your own. Keep up the great work!",
    badge: "⭐ Independent",
    badgeBg: "bg-[#e8f5e9]",
    badgeText: "text-[#2e7d32]",
    accent: "border-[#4CAF50]",
    mascot: "/Independent.svg",
  },
  INSTRUCTIONAL: {
    label: "Instructional Reader",
    message:
      "Great effort! With a little guidance, you'll master this in no time.",
    badge: "📘 Instructional",
    badgeBg: "bg-[#e8eaff]",
    badgeText: "text-[#27348B]",
    accent: "border-[#6666FF]",
    mascot: "/Instructional.svg",
  },
  FRUSTRATION: {
    label: "Keep Practicing!",
    message:
      "Don't give up! Every reader grows one page at a time. You've got this!",
    badge: "💪 Needs Practice",
    badgeBg: "bg-[#fff3e0]",
    badgeText: "text-[#e65100]",
    accent: "border-[#FF9800]",
    mascot: "/Frustrated.svg",
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
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative mx-4 flex w-full max-w-sm flex-col items-center rounded-2xl border-l border-t border-r-[6px] border-b-[6px] ${config.accent} bg-white p-6 shadow-[0_8px_32px_rgba(102,102,255,0.18)]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-[#6666FF]/60 hover:bg-[#e8eaff] hover:text-[#6666FF] transition-colors"
          aria-label="Close popup"
          title="Close popup"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-center -mt-8 mb-0">
          <Image
            src={config.mascot}
            alt={config.label}
            width={200}
            height={200}
            className="object-contain"
            priority
          />
        </div>

        <span
          className={`mb-1 inline-block rounded-full px-4 py-1 text-xs font-bold ${config.badgeBg} ${config.badgeText}`}
        >
          {config.badge}
        </span>

        <h2 className="mb-1 text-center text-xl font-bold text-[#27348B]">
          {config.label}
        </h2>

        <p className="mb-1 text-center text-sm font-semibold text-[#6666FF]">
          Well done, {firstName}!
        </p>
        {/* Message */}
        <p className="text-center text-sm text-[#27348B]/70 leading-relaxed">
          {config.message}
        </p>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-[#6666FF] hover:bg-[#5555ee] text-white font-bold py-2.5 text-sm border-l border-t border-r-[6px] border-b-[6px] border-[#4444CC] transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
