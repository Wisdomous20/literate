"use client";

import type { ReactNode } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ClipboardCheck,
  Clock,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { AssessmentLinkData } from "./types";

export const pageShellClass =
  "min-h-screen bg-[radial-gradient(circle_at_top,#f8f4ff_0%,#f3f7ff_34%,#eef5ff_68%,#f8fbff_100%)] text-[#1E2857]";
export const surfaceClass =
  "rounded-3xl border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-white shadow-[0_18px_50px_rgba(102,83,249,0.12)]";
export const panelClass =
  "rounded-3xl border border-[#E3E8FF] bg-[#F7F8FF]/90 shadow-[0_10px_30px_rgba(93,93,251,0.08)]";
export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#3B21CC] border-b-[#3B21CC] bg-[#5D5DFB] px-8 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(93,93,251,0.24)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl border border-[#D4DBFF] bg-white px-4 py-2 text-sm font-semibold text-[#4B50E6] transition-colors hover:bg-[#F6F7FF]";

const iconWrapClass =
  "flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D9DEFF] bg-[#EEF1FF]";

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatReadingTime(totalSeconds: number): {
  value: string;
  subtitle: string;
} {
  if (totalSeconds >= 3600) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    return {
      value: mins > 0 ? `${hrs}:${String(mins).padStart(2, "0")}` : String(hrs),
      subtitle: mins > 0 ? "Hours and minutes" : "Hours",
    };
  }

  if (totalSeconds >= 60) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.round(totalSeconds % 60);
    return {
      value: secs > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : String(mins),
      subtitle: secs > 0 ? "Minutes and seconds" : "Minutes",
    };
  }

  return { value: String(Math.round(totalSeconds)), subtitle: "Seconds" };
}

export function getAssessmentTitle(type: string): string {
  switch (type) {
    case "ORAL_READING":
      return "Oral Reading Test";
    case "COMPREHENSION":
      return "Reading Comprehension Test";
    case "READING_FLUENCY":
      return "Reading Fluency Test";
    default:
      return "Assessment";
  }
}

export function getAssessmentIcon(type: string) {
  switch (type) {
    case "ORAL_READING":
      return <FileText className="h-5 w-5 text-[#5D5DFB]" />;
    case "COMPREHENSION":
      return <ClipboardCheck className="h-5 w-5 text-[#5D5DFB]" />;
    case "READING_FLUENCY":
      return <BookOpen className="h-5 w-5 text-[#5D5DFB]" />;
    default:
      return <FileText className="h-5 w-5 text-[#5D5DFB]" />;
  }
}

export function SharedAssessmentHeaderByType({
  type,
  subtitle,
  badge,
}: {
  type: AssessmentLinkData["type"];
  subtitle: string;
  badge?: string;
}) {
  return (
    <header className="border-b-[3px] border-[#5D5DFB] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className={iconWrapClass}>{getAssessmentIcon(type)}</div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7C84C4]">
              LiteRate
            </p>
            <h1 className="truncate text-lg font-semibold text-[#483EFA] md:text-xl">
              {getAssessmentTitle(type)}
            </h1>
            <p className="truncate text-xs text-[#66739B] md:text-sm">
              {subtitle}
            </p>
          </div>
        </div>

        {badge && (
          <span className="hidden rounded-full border border-[#DDD8FF] bg-[#F6F1FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7A4CE0] sm:inline-flex">
            {badge}
          </span>
        )}
      </div>
    </header>
  );
}

export function PageStateCard({
  icon,
  title,
  message,
  tone = "default",
}: {
  icon: "loading" | "error" | "success" | "sparkles";
  title: string;
  message: string;
  tone?: "default" | "danger" | "success";
}) {
  const iconNode =
    icon === "loading" ? (
      <Loader2 className="h-7 w-7 animate-spin text-[#5D5DFB]" />
    ) : icon === "error" ? (
      <AlertCircle className="h-7 w-7 text-red-500" />
    ) : icon === "success" ? (
      <CheckCircle className="h-7 w-7 text-green-600" />
    ) : (
      <Sparkles className="h-7 w-7 text-[#5D5DFB]" />
    );

  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50"
      : tone === "success"
        ? "border-green-200 bg-green-50"
        : "bg-[#EEF1FF]";

  return (
    <div className={`${surfaceClass} w-full max-w-lg px-8 py-10 text-center`}>
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${toneClass}`}
      >
        {iconNode}
      </div>
      <h1 className="mt-5 text-xl font-semibold text-[#263168]">{title}</h1>
      <p className="mt-2 text-sm text-[#66739B]">{message}</p>
    </div>
  );
}

export function CenteredPageState({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`${pageShellClass} flex items-center justify-center px-4`}>
      {children}
    </div>
  );
}

export function StatPill({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[#DBE2FF] bg-[#F7F8FF] px-3 py-1.5 text-xs font-medium text-[#66739B]">
      {icon ?? <Clock className="h-3.5 w-3.5 text-[#5D5DFB]" />}
      {children}
    </div>
  );
}
