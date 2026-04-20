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
    gradient: "from-green-400 to-green-600",
    glow: "shadow-[0_0_60px_rgba(34,197,94,0.3)]",
    badge: "bg-green-100 text-green-800 border-green-200",
  },
  INSTRUCTIONAL: {
    label: "Instructional",
    message: "Great effort! With a little help, you'll master this!",
    gradient: "from-indigo-400 to-indigo-600",
    glow: "shadow-[0_0_60px_rgba(99,102,241,0.3)]",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  FRUSTRATION: {
    label: "Frustration",
    message: "Keep going! Every reader grows one page at a time!",
    gradient: "from-purple-400 to-purple-600",
    glow: "shadow-[0_0_60px_rgba(139,92,246,0.3)]",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
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
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-800"
          aria-label="Close popup"
          title="Close popup"
        >
          <X className="h-5 w-5" />
        </button>

        <Sparkles className="absolute left-6 top-6 h-5 w-5 animate-pulse text-yellow-400" />
        <Sparkles className="absolute right-14 top-8 h-4 w-4 animate-pulse text-purple-400 delay-300" />

        <div className="relative -mt-2 mb-4 flex items-center justify-center" style={{ height: 112, width: 112 }}>
          <Image
            src="/images/Mascot.svg"
            alt="LiteRate Mascot"
            width={112}
            height={112}
            className="object-contain drop-shadow-lg"
            priority
          />
        </div>

        <div
          className={`mb-3 rounded-full border px-5 py-1.5 text-sm font-bold ${config.badge}`}
        >
          {config.label} Reader
        </div>

        <h2 className="mb-1 text-center text-xl font-bold text-indigo-900">
          Way to go, {firstName}!
        </h2>

        {score && (
          <p className="mb-1 text-center text-lg font-bold text-indigo-700">
            Score: {score}
          </p>
        )}

        <p className="mb-1 text-center text-xs font-medium text-gray-400">
          {assessmentLabel} Test
        </p>

        <p className="mb-2 text-center text-2xl font-extrabold">
          <span
            className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}
          >
            You&apos;re an {config.label} Reader!
          </span>
        </p>

        <p className="mb-6 text-center text-sm text-gray-400">
          {config.message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className={`w-full rounded-xl bg-gradient-to-r ${config.gradient} px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}