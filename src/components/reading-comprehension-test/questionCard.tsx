"use client";

const OPTION_LABELS = ["A", "B", "C", "D"];

const TAG_HIGHLIGHT: Record<
  string,
  { bg: string; border: string; shadow: string }
> = {
  literal: {
    bg: "rgba(160, 200, 255, 0.35)",
    border: "#2563EB",
    shadow: "0px 1px 20px rgba(37, 99, 235, 0.3)",
  },
  inferential: {
    bg: "rgba(180, 170, 240, 0.4)",
    border: "#4B3BA3",
    shadow: "0px 1px 20px rgba(75, 59, 163, 0.3)",
  },
  critical: {
    bg: "rgba(253, 182, 210, 0.44)",
    border: "#C41048",
    shadow: "0px 1px 20px rgba(196, 16, 72, 0.3)",
  },
};

export interface QuestionData {
  id: string;
  questionNumber: number;
  questionText: string;
  type: "MULTIPLE_CHOICE" | "ESSAY";
  tags?: string;
  options?: string[];
}

interface QuestionCardProps {
  question: QuestionData;
  answer: string | undefined;
  highlightedTag: "literal" | "inferential" | "critical" | null;
  isSubmitted: boolean;
  onSelectOption: (questionId: string, option: string) => void;
  onEssayChange: (questionId: string, value: string) => void;
}

export function QuestionCard({
  question,
  answer,
  highlightedTag,
  isSubmitted,
  onSelectOption,
  onEssayChange,
}: QuestionCardProps) {
  const tagKey = question.tags?.toLowerCase() as
    | "literal"
    | "inferential"
    | "critical"
    | undefined;

  const highlight =
    highlightedTag && tagKey === highlightedTag ? TAG_HIGHLIGHT[tagKey] : null;

  const tagClass = highlight ? "" : "border-[#DED9FF] bg-white shadow-sm";

  return (
    <div
      className={`rounded-xl border p-4 transition-colors duration-200 sm:p-5 ${typeof tagClass === "string" ? tagClass : ""}`}
      style={
        highlight
          ? {
              backgroundColor: highlight.bg,
              borderColor: highlight.border,
              boxShadow: highlight.shadow,
            }
          : undefined
      }
    >
      {/* Question Header */}
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6666FF] shadow-sm">
          <span className="text-xs font-semibold text-white">
            {question.questionNumber}
          </span>
        </div>
        <h3 className="pt-0.5 text-sm font-semibold leading-6 text-[#00306E] sm:text-[15px]">
          {question.questionText}
        </h3>
      </div>

      {/* Multiple Choice Options */}
      {question.type === "MULTIPLE_CHOICE" && question.options && (
        <div className="ml-10 space-y-1">
          {question.options.map((option, index) => {
            const label = OPTION_LABELS[index];
            const isSelected = answer === option;

            return (
              <button
                key={index}
                onClick={() => onSelectOption(question.id, option)}
                disabled={isSubmitted}
                className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6666FF]/40 ${
                  isSelected
                      ? "bg-[#EDEAFF]"
                    : "hover:bg-[#162DB0]/5"
                } ${isSubmitted ? "cursor-default" : ""}`}
              >
                <div
                  className={`shrink-0 w-7 h-6.5 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected
                  ? "border border-[#5D5DFB] bg-[#6666FF]"
                      : "border border-[#D7D5E8] bg-[#F4F3FA]"
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? "text-white" : "text-[#0F2676]"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                <span className="text-sm text-[#00306E]">{option}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Essay Input */}
      {question.type === "ESSAY" && (
        <div className="ml-10">
          <textarea
            value={answer || ""}
            onChange={(e) => onEssayChange(question.id, e.target.value)}
            disabled={isSubmitted}
            placeholder="Type your answer here..."
            className="min-h-24 w-full resize-none rounded-lg bg-white px-3 py-2.5 text-sm text-[#00306E] placeholder:text-[#00306E]/40 outline-none disabled:cursor-default disabled:opacity-60"
          />
        </div>
      )}
    </div>
  );
}
