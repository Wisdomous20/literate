"use client";

import { X, Star, BookOpen, Flame } from "lucide-react";

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
    icon: React.ReactNode;
    message: string;
    bubble: string;
    accent: string;
    iconBg: string;
  }
> = {
  INDEPENDENT: {
    icon: <Star className="h-8 w-8 text-[#2e7d32]" strokeWidth={2} />,
    message: "Amazing! You can read this all on your own. Keep up the great work!",
    bubble: "bg-[#e8f5e9] border-[#4CAF50]",
    accent: "text-[#2e7d32]",
    iconBg: "bg-[#e8f5e9] border-[#4CAF50]",
  },
  INSTRUCTIONAL: {
    icon: <BookOpen className="h-8 w-8 text-[#27348B]" strokeWidth={2} />,
    message: "Great effort! With a little guidance, you'll master this in no time.",
    bubble: "bg-[#e8eaff] border-[#6666FF]",
    accent: "text-[#27348B]",
    iconBg: "bg-[#e8eaff] border-[#6666FF]",
  },
  FRUSTRATION: {
    icon: <Flame className="h-8 w-8 text-[#e65100]" strokeWidth={2} />,
    message: "Don't give up! Every reader grows one page at a time. You've got this!",
    bubble: "bg-[#fff3e0] border-[#FF9800]",
    accent: "text-[#e65100]",
    iconBg: "bg-[#fff3e0] border-[#FF9800]",
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
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative mx-4 w-full max-w-xs rounded-2xl border-2 ${config.bubble} bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)]`}
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
          <X className="h-4 w-4" />
        </button>

        {/* Icon bubble */}
        <div className="flex flex-col items-center gap-3">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${config.iconBg}`}>
            {config.icon}
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-[#27348B]">
              Well done, {firstName}!
            </p>
            <p className={`mt-1 text-xs font-semibold ${config.accent}`}>
              {classificationLevel.charAt(0) + classificationLevel.slice(1).toLowerCase()} Level
            </p>
          </div>

          {/* Speech bubble message */}
          <div className={`relative rounded-xl border ${config.bubble} px-4 py-3 text-center`}>
            {/* Bubble tail */}
            <div className={`absolute -top-2 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-t-2 border-l-2 ${config.bubble} bg-white`} />
            <p className="text-xs text-[#27348B]/80 leading-relaxed">
              {config.message}
            </p>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-full bg-[#6666FF] hover:bg-[#5555ee] text-white font-bold py-2.5 text-sm transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
