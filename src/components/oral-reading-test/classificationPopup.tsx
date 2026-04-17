// src/components/oral-reading-test/classificationPopup.tsx
"use client";

import { useEffect } from "react";
import { X, Sparkles } from "lucide-react";
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
    gradient: string;
    glow: string;
    badge: string;
  }
> = {
  INDEPENDENT: {
    label: "Independent",
    message: "Amazing job! You can read this all on your own!",
    gradient: "from-[#34D399] to-[#10B981]",
    glow: "shadow-[0_0_60px_rgba(52,211,153,0.4)]",
    badge: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
  },
  INSTRUCTIONAL: {
    label: "Instructional",
    message: "Great effort! With a little help, you'll master this!",
    gradient: "from-[#818CF8] to-[#6366F1]",
    glow: "shadow-[0_0_60px_rgba(129,140,248,0.4)]",
    badge: "bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]",
  },
  FRUSTRATION: {
    label: "Frustration",
    message: "Keep going! Every reader grows one page at a time!",
    gradient: "from-[#FB923C] to-[#F97316]",
    glow: "shadow-[0_0_60px_rgba(251,146,60,0.4)]",
    badge: "bg-[#FFF7ED] text-[#9A3412] border-[#FED7AA]",
  },
};

export function ClassificationPopup({
  classificationLevel,
  studentName,
  onClose,
  score,
  assessmentType = "oral-reading",
}: ClassificationPopupProps) {
  const config =
    LEVEL_CONFIG[classificationLevel.toUpperCase()] ??
    LEVEL_CONFIG.INSTRUCTIONAL;

  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const firstName = studentName.trim().split(" ")[0] || "Reader";

  const assessmentLabel =
    assessmentType === "comprehension"
      ? "Reading Comprehension"
      : assessmentType === "fluency"
        ? "Reading Fluency"
        : "Oral Reading";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className={`relative mx-4 flex w-full max-w-md flex-col items-center rounded-3xl bg-white p-8 ${config.glow} animate-in zoom-in-95 slide-in-from-bottom-4 duration-500`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[#6B7280] transition-colors hover:bg-gray-100 hover:text-gray-800"
          aria-label="Close popup"
          title="Close popup"
        >
          <X className="h-5 w-5" />
        </button>

        <Sparkles className="absolute left-6 top-6 h-5 w-5 animate-pulse text-yellow-400" />
        <Sparkles className="absolute right-14 top-8 h-4 w-4 animate-pulse text-purple-400 delay-300" />

        <div className="relative -mt-2 mb-4 h-40 w-40">
          <Image
            src="/images/bee.png"
            alt="LiteRate Bee Mascot"
            fill
            className="object-contain drop-shadow-lg"
            priority
          />
        </div>

        <div
          className={`mb-3 rounded-full border px-5 py-1.5 text-sm font-bold ${config.badge}`}
        >
          {config.label} Reader
        </div>

        <h2 className="mb-1 text-center text-xl font-bold text-[#1E1B4B]">
          Way to go, {firstName}!
        </h2>

        {score && (
          <p className="mb-1 text-center text-lg font-bold text-[#31318A]">
            Score: {score}
          </p>
        )}

        <p className="mb-1 text-center text-xs font-medium text-[#6B7280]">
          {assessmentLabel} Test
        </p>

        <p className="mb-2 text-center text-2xl font-extrabold">
          <span
            className={`bg-linear-to-r ${config.gradient} bg-clip-text text-transparent`}
          >
            You&apos;re an {config.label} Reader!
          </span>
        </p>

        <p className="mb-6 text-center text-sm text-[#6B7280]">
          {config.message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className={`w-full rounded-xl bg-linear-to-r ${config.gradient} px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
