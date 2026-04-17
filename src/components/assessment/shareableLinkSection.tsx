"use client";

import { useState, useCallback } from "react";
import {
  Link2,
  Copy,
  Check,
  Loader2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createShareableLink } from "@/app/actions/assessment-link/createShareableLink";
import type { AssessmentType } from "@/generated/prisma/enums";

interface ShareableLinkSectionProps {
  studentId: string;
  passageId: string;
  assessmentType: AssessmentType;
  /** Hide expiry picker and use default (24h) */
  compact?: boolean;
}

const EXPIRY_OPTIONS = [
  { label: "1 hour", value: 1 },
  { label: "6 hours", value: 6 },
  { label: "12 hours", value: 12 },
  { label: "24 hours", value: 24 },
  { label: "48 hours", value: 48 },
  { label: "7 days", value: 168 },
];

export function ShareableLinkSection({
  studentId,
  passageId,
  assessmentType,
  compact = false,
}: ShareableLinkSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [expiryHours, setExpiryHours] = useState(24);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedUrl(null);

    try {
      const expiresAt = new Date(
        Date.now() + expiryHours * 60 * 60 * 1000,
      ).toISOString();

      const result = await createShareableLink({
        studentId,
        passageId,
        type: assessmentType,
        expiresAt,
      });

      if ("error" in result) {
        if (result.code === "PREMIUM_REQUIRED") {
          setError(
            result.error ||
              "Shareable links are available on paid plans only.",
          );
        } else {
          setError(result.error || "Failed to generate link.");
        }
        return;
      }

      if ("url" in result && result.url) {
        setGeneratedUrl(result.url);
      } else {
        setError("Failed to generate link.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [studentId, passageId, assessmentType, expiryHours]);

  const handleCopy = useCallback(async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = generatedUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedUrl]);

  const assessmentLabel =
    assessmentType === "ORAL_READING"
      ? "Oral Reading Test"
      : assessmentType === "COMPREHENSION"
        ? "Reading Comprehension Test"
        : "Reading Fluency Test";

  return (
    <div className="rounded-2xl border border-[#54A4FF] bg-[#FEFFFD] shadow-[0_1px_20px_rgba(108,164,239,0.37)]">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-[rgba(102,102,255,0.03)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF]">
            <Link2 className="h-4.5 w-4.5 text-[#6666FF]" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-[#00306E]">
              Share Assessment Link
            </h3>
            <p className="text-xs text-[#6B7DB3]">
              Generate a link for the student to take this assessment on their
              own device
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-[#6B7DB3]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#6B7DB3]" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-[#DAE6FF] px-6 py-5 space-y-4">
          {/* Assessment type label */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#31318A] bg-[rgba(102,102,255,0.08)] px-2.5 py-1 rounded-full">
              {assessmentLabel}
            </span>
          </div>

          {/* Expiry selector */}
          {!compact && !generatedUrl && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-[#6B7DB3]" />
              <span className="text-xs font-medium text-[#00306E]">
                Link expires in:
              </span>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
                className="rounded-lg border border-[#DAE6FF] bg-white px-3 py-1.5 text-xs font-medium text-[#00306E] outline-none focus:border-[#6666FF] focus:ring-1 focus:ring-[#6666FF]"
                title="Link expiry time"
                aria-label="Link expiry time"
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <p className="text-xs font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Generated link */}
          {generatedUrl && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#DAE6FF] bg-[rgba(102,102,255,0.04)] px-4 py-3">
                <input
                  type="text"
                  value={generatedUrl}
                  readOnly
                  className="flex-1 bg-transparent text-xs font-medium text-[#31318A] outline-none truncate"
                  aria-label="Generated shareable link"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#2E2E68] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#222255]"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-[#6B7DB3]">
                This link will expire in {expiryHours} hours and can only be
                used once. Share it with your student so they can take the
                assessment on their own device.
              </p>
              <button
                type="button"
                onClick={() => {
                  setGeneratedUrl(null);
                  setError(null);
                }}
                className="text-xs font-semibold text-[#6666FF] hover:text-[#5555EE] transition-colors"
              >
                Generate a new link
              </button>
            </div>
          )}

          {/* Generate button */}
          {!generatedUrl && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !studentId || !passageId}
              className={`flex items-center justify-center gap-2 w-full rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 ${
                isGenerating || !studentId || !passageId
                  ? "bg-[#2E2E68]/30 cursor-not-allowed opacity-60"
                  : "bg-[#2E2E68] shadow-[0px_1px_20px_rgba(108,164,239,0.37)] hover:brightness-110"
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Generate Shareable Link
                </>
              )}
            </button>
          )}

          {(!studentId || !passageId) && !generatedUrl && (
            <p className="text-xs text-[#6B7DB3] text-center">
              {!studentId
                ? "Please select or create a student first."
                : "Please select a passage first."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}