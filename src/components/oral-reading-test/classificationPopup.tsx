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
  }
> = {
  INDEPENDENT: {
    label: "Independent Reader",
    message: "You can read this all on your own!",
  },
  INSTRUCTIONAL: {
    label: "Instructional Reader",
    message: "With a little help, you'll master this!",
  },
  FRUSTRATION: {
    label: "Keep Practicing!",
    message: "Every reader grows one page at a time.",
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
        className="relative mx-4 flex w-full max-w-xs flex-col items-center rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-800"
          aria-label="Close popup"
          title="Close popup"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center justify-center" style={{ height: 96, width: 96 }}>
          <Image
            src="/images/mascot.svg"
            alt="LiteRate Mascot"
            width={96}
            height={96}
            className="object-contain"
            priority
          />
        </div>

        <div className="mb-2 text-center text-lg font-bold text-[#31318A]">
          {config.label}
        </div>
        <div className="mb-1 text-center text-base text-[#4B5563]">
          {firstName}, {config.message}
        </div>
      </div>
    </div>
  );
}