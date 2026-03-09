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

  const highlight = highlightedTag && tagKey === highlightedTag
    ? TAG_HIGHLIGHT[tagKey]
    : null;

  const tagClass = highlight
    ? ""
    : "bg-[#EFFDFF] border-[#10AABF] shadow-[0px_1px_20px_rgba(65,155,180,0.47)]";

  return (
    <div
      className={`rounded-4xl border px-8 py-6 transition-all duration-300 ${tagClass}`}
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
      <div className="mb-2 flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#00306E] bg-[#0C1A6D]">
          <span className="text-xs font-semibold text-white">
            {question.questionNumber}
          </span>
        </div>
        <h3 className="text-[15px] font-semibold leading-8.75 text-[#00306E]">
          {question.questionText}
        </h3>
      </div>

      {/* Multiple Choice Options */}
      {question.type === "MULTIPLE_CHOICE" && question.options && (
        <div className="space-y-1 ml-10">
          {question.options.map((option, index) => {
            const label = OPTION_LABELS[index];
            const isSelected = answer === option;

            return (
              <button
                key={index}
                onClick={() => onSelectOption(question.id, option)}
                disabled={isSubmitted}
                className={`flex items-center gap-3 w-full text-left py-1 px-2 rounded-lg transition-all duration-200 ${
                  isSelected
                    ? "bg-[#162DB0]/10 shadow-[0px_0px_10px_rgba(255,176,32,0.3)]"
                    : "hover:bg-[#162DB0]/5"
                } ${isSubmitted ? "cursor-default" : ""}`}
              >
                <div
                  className={`shrink-0 w-7 h-6.5 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? "bg-[#0C1A6D] border-2 border-[#00306E] shadow-[0px_0px_8px_rgba(255,176,32,0.5)]"
                      : "bg-[rgba(185,188,207,0.36)]"
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
                <span className="text-[#00306E] text-[15px]">{option}</span>
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
            className="w-full min-h-12.5 bg-[rgba(108,164,239,0.09)] rounded-md px-4 py-3 text-[#00306E] text-[15px] placeholder:text-[#00306E]/40 outline-none resize-y disabled:opacity-60"
          />
        </div>
      )}
    </div>
  );
}
