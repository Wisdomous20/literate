"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";

interface ClassificationPopupProps {
  classificationLevel: string;
  studentName: string;
  onClose: () => void;
  score?: string;
  assessmentType?: "oral-reading" | "comprehension" | "fluency";
  positionClassName?: string;
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
    progressBg: string;
  }
> = {
  INDEPENDENT: {
    iconSrc: "/Independent.svg",
    iconAlt: "Independent bee logo",
    message: "Read it alone",
    cloudBorder: "border-[#22C55E]",
    cloudBg: "bg-[#F0FDF4]",
    accent: "text-[#2e7d32]",
    progressBg: "bg-[#22C55E]",
  },
  INSTRUCTIONAL: {
    iconSrc: "/Instructional.svg",
    iconAlt: "Instructional bee logo",
    message: "A little help",
    cloudBorder: "border-[#3B82F6]",
    cloudBg: "bg-[#EFF6FF]",
    accent: "text-[#27348B]",
    progressBg: "bg-[#3B82F6]",
  },
  FRUSTRATION: {
    iconSrc: "/Frustrated.svg",
    iconAlt: "Frustration bee logo",
    message: "Needs more practice",
    cloudBorder: "border-[#EF4444]",
    cloudBg: "bg-[#FEF2F2]",
    accent: "text-[#B91C1C]",
    progressBg: "bg-[#EF4444]",
  },
};

export function ClassificationPopup({
  classificationLevel,
  studentName,
  onClose,
  positionClassName = "fixed bottom-24 left-4 z-[9999] md:bottom-6 md:left-24",
}: ClassificationPopupProps) {
  const config =
    LEVEL_CONFIG[classificationLevel.toUpperCase()] ||
    LEVEL_CONFIG.INSTRUCTIONAL;

  const firstName = studentName.trim().split(" ")[0] || "Reader";

  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), 7000);
    return () => clearTimeout(timer);
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <style>{`
        @keyframes classification-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .classification-progress {
          animation: classification-shrink 7s linear forwards;
        }
        @keyframes classification-slide-in {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .classification-enter {
          animation: classification-slide-in 0.25s ease-out forwards;
        }
      `}</style>
      <div
        className={`classification-enter flex w-52 flex-col items-center ${positionClassName}`}
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
            className={`relative w-full rounded-[28px] border-3 px-4 py-4 text-center shadow-[0_14px_34px_rgba(17,24,39,0.14)] ${config.cloudBg} ${config.cloudBorder}`}
          >
            <p className="text-sm font-bold text-[#27348B]">
              Well done, {firstName}!
            </p>
            <p className={`mt-1 text-xs font-extrabold uppercase tracking-[0.08em] ${config.accent}`}>
              {classificationLevel.charAt(0) +
                classificationLevel.slice(1).toLowerCase()}{" "}
              Level
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#27348B]/85">
              {config.message}
            </p>

            <div
              className={`absolute -bottom-3.5 left-1/2 h-6 w-6 -translate-x-1/2 rotate-45 rounded-[5px] border-r-3 border-b-3 ${config.cloudBorder} ${config.cloudBg}`}
            />
          </div>

          <div className="relative mt-3 rounded-full bg-white/85 p-1.5 shadow-[0_16px_30px_rgba(39,52,139,0.2)]">
            <Image
              src={config.iconSrc}
              alt={config.iconAlt}
              width={88}
              height={88}
              className="h-20 w-20 object-contain"
            />
          </div>
        </div>

        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-black/10">
          <div className={`classification-progress h-full rounded-full ${config.progressBg}`} />
        </div>
      </div>
    </>,
    document.body,
  );
}
