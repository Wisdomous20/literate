interface BreakdownItem {
  label: string
  key: "literal" | "inferential" | "critical"
  color: string
  textColor: string
  highlightColor: string
}

const breakdownItems: BreakdownItem[] = [
  { label: "Literal", key: "literal", color: "rgba(160, 200, 255, 0.4)", textColor: "#1A5FB4", highlightColor: "#2563EB" },
  { label: "Inferential", key: "inferential", color: "rgba(180, 170, 240, 0.4)", textColor: "#4B3BA3", highlightColor: "#4B3BA3" },
  { label: "Critical", key: "critical", color: "rgba(253, 182, 210, 0.44)", textColor: "#C41048", highlightColor: "#C41048" },
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

function getLevelStyle(level: string): { bg: string; text: string } {
  switch (level.toLowerCase()) {
    case "frustration":
      return { bg: "rgba(220, 38, 38, 0.15)", text: "#DC2626" }
    case "instructional":
      return { bg: "rgba(37, 99, 235, 0.15)", text: "#2563EB" }
    case "independent":
      return { bg: "rgba(22, 163, 74, 0.15)", text: "#16A34A" }
    default:
      return { bg: "rgba(230, 230, 250, 0.2)", text: "#2E2EA3" }
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

  return (
    <div
      className="flex flex-col rounded-[20px] px-5 py-4"
      style={{
        background: "#EFFDFF",
        border: "1px solid #54A4FF",
        boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.37)",
      }}
    >
      {/* Title */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#6666FF] mb-3 block">
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
                <span
                  className="text-sm font-bold"
                  style={{ color: "#31318A" }}
                >
                  {item.label}
                </span>
                {/* Color-coded badge at right, clickable */}
                <button
                  type="button"
                  className={`flex h-6 w-7 items-center justify-center rounded-[5px] text-sm font-bold border transition-all ${isHighlighted ? "ring-2 ring-blue-400" : ""}`}
                  style={{
                    background: item.color,
                    border: "1px solid #DAE6FF",
                    color: item.textColor,
                    boxShadow: isHighlighted ? `0 0 0 2px ${item.highlightColor}` : undefined,
                  }}
                  onClick={() => onTagClick && onTagClick(item.key)}
                >
                  {tagValues[item.key] ?? "--"}
                </button>
              </div>
              {/* Divider */}
              {index < breakdownItems.length - 1 && (
                <div
                  className="h-px"
                  style={{ background: "rgba(18, 48, 220, 0.25)" }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom Results */}
      <div className="mt-auto pt-3">
        <div className="flex flex-col gap-1.5">
          {/* Score */}
          <div
            className="flex items-center justify-between rounded px-3 py-1.5"
            style={{ background: "rgba(230, 230, 250, 0.5)" }}
          >
            <span className="text-xs font-bold" style={{ color: "#31318A" }}>
              Total Score: 
            </span>
            <span
              className="text-[17px] font-semibold"
              style={{ color: "#2E2EA3", fontFamily: "Kanit, sans-serif" }}
            >
              {score}
            </span>
          </div>

          {/* Percentage */}
          <div
            className="flex items-center justify-between rounded px-3 py-1.5"
            style={{ background: "rgba(230, 230, 250, 0.35)" }}
          >
            <span className="text-xs font-bold" style={{ color: "#31318A" }}>
              Comprehension Rate: 
            </span>
            <span
              className="text-[17px] font-semibold"
              style={{ color: "#2E2EA3", fontFamily: "Kanit, sans-serif" }}
            >
              {percentage}
            </span>
          </div>

          {/* Level */}
          <div
            className="flex items-center justify-between rounded px-3 py-1.5"
            style={{ background: getLevelStyle(classificationLevel).bg }}
          >
            <span className="text-xs font-bold" style={{ color: "#31318A" }}>
              Comprehension Level:
            </span>
            <span
              className="text-[17px] font-semibold"
              style={{ color: getLevelStyle(classificationLevel).text, fontFamily: "Kanit, sans-serif" }}
            >
              {classificationLevel}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
