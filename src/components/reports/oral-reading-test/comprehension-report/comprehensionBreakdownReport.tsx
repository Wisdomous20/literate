interface BreakdownItem {
  label: string
  key: "literal" | "inferential" | "critical"
  colorClass: string
  textClass: string
  highlightColorClass: string
}

const breakdownItems: BreakdownItem[] = [
  {
    label: "Literal",
    key: "literal",
    colorClass: "bg-[rgba(160,200,255,0.4)]",
    textClass: "text-[#1A5FB4]",
    highlightColorClass: "ring-[#2563EB]",
  },
  {
    label: "Inferential",
    key: "inferential",
    colorClass: "bg-[rgba(180,170,240,0.4)]",
    textClass: "text-[#4B3BA3]",
    highlightColorClass: "ring-[#4B3BA3]",
  },
  {
    label: "Critical",
    key: "critical",
    colorClass: "bg-[rgba(253,182,210,0.44)]",
    textClass: "text-[#C41048]",
    highlightColorClass: "ring-[#C41048]",
  },
]

interface ComprehensionBreakdownReportProps {
  score: string
  literal: number | string
  inferential: number | string
  critical: number | string
  mistakes?: number | string
  numberOfItems: number | string
  classificationLevel: string
  highlightedTag?: "literal" | "inferential" | "critical" | null
  onTagClick?: (tag: "literal" | "inferential" | "critical") => void
}

function getLevelStyle(level: string): { bgClass: string; textClass: string } {
  if (!level) {
    return {
      bgClass: "bg-[rgba(230,230,250,0.2)]",
      textClass: "text-[#2E2EA3]",
    }
  }

  switch (level.toLowerCase()) {
    case "frustration":
      return {
        bgClass: "bg-[rgba(220,38,38,0.15)]",
        textClass: "text-[#DC2626]",
      }
    case "instructional":
      return {
        bgClass: "bg-[rgba(37,99,235,0.15)]",
        textClass: "text-[#2563EB]",
      }
    case "independent":
      return {
        bgClass: "bg-[rgba(22,163,74,0.15)]",
        textClass: "text-[#16A34A]",
      }
    default:
      return {
        bgClass: "bg-[rgba(230,230,250,0.2)]",
        textClass: "text-[#2E2EA3]",
      }
  }
}

export default function ComprehensionBreakdownReport({
  score,
  literal,
  inferential,
  critical,
  numberOfItems,
  classificationLevel,
  highlightedTag = null,
  onTagClick,
}: ComprehensionBreakdownReportProps) {
  const tagValues: Record<string, number | string> = {
    literal,
    inferential,
    critical,
  }

  const percentage =
    typeof numberOfItems === "number" && numberOfItems > 0
      ? `${Math.round((Number(score.split("/")[0]) / numberOfItems) * 100)}%`
      : "--"

  const levelStyle = getLevelStyle(classificationLevel)

  return (
    <div className="flex flex-col rounded-4xl border border-[#54A4FF] bg-[#EFFDFF] px-5 py-4 shadow-[0px_1px_20px_rgba(108,164,239,0.37)]">
      {/* Title */}
      <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-[#6666FF]">
        Comprehension Breakdown
      </span>

      {/* Breakdown Items */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {breakdownItems.map((item, index) => {
          const isHighlighted = highlightedTag === item.key
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between py-2">
                {/* Label */}
                <span className={`text-sm font-bold ${item.textClass}`}>
                  {item.label}
                </span>
                {/* Color-coded badge at right, clickable */}
                <button
                  type="button"
                  className={`flex h-6 w-7 items-center justify-center rounded-[5px] border border-[#DAE6FF] text-sm font-bold transition-all ${item.colorClass} ${item.textClass} ${
                    isHighlighted
                      ? `ring-2 ${item.highlightColorClass}`
                      : ""
                  }`}
                  onClick={() => onTagClick && onTagClick(item.key)}
                >
                  {tagValues[item.key] ?? "--"}
                </button>
              </div>

              {/* Divider */}
              {index < breakdownItems.length - 1 && (
                <div className="h-px bg-[rgba(18,48,220,0.25)]" />
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom Results */}
      <div className="mt-auto pt-3">
        <div className="flex flex-col gap-1.5">
          {/* Score */}
          <div className="flex items-center justify-between rounded bg-[rgba(230,230,250,0.5)] px-3 py-1.5">
            <span className="text-xs font-bold text-[#31318A]">
              Total Score:
            </span>
            <span className="text-[17px] font-semibold text-[#2E2EA3] font-[Kanit,sans-serif]">
              {score}
            </span>
          </div>

          {/* Percentage */}
          <div className="flex items-center justify-between rounded bg-[rgba(230,230,250,0.35)] px-3 py-1.5">
            <span className="text-xs font-bold text-[#31318A]">
              Comprehension Rate:
            </span>
            <span className="text-[17px] font-semibold text-[#2E2EA3] font-[Kanit,sans-serif]">
              {percentage}
            </span>
          </div>

          {/* Level */}
          <div
            className={`flex items-center justify-between rounded px-3 py-1.5 ${levelStyle.bgClass}`}
          >
            <span className="text-xs font-bold text-[#31318A]">
              Comprehension Level:
            </span>
            <span
              className={`text-[17px] font-semibold font-[Kanit,sans-serif] ${levelStyle.textClass}`}
            >
              {classificationLevel}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}