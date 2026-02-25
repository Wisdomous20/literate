import { MoreVertical } from "lucide-react"

interface BreakdownItem {
  label: string
  badge: string
  badgeColor: string
  badgeBg: string
  value: number | string
  valueColor: string
}

interface ComprehensionBreakdownReportProps {
  score: string
  literal: number | string
  inferential: number | string
  critical: number | string
  mistakes: number | string
  numberOfItems: number | string
  classificationLevel: string
}

const BREAKDOWN_ITEMS: BreakdownItem[] = [
  {
    label: "Literal",
    badge: "L",
    badgeColor: "#E51355",
    badgeBg: "rgba(253, 182, 210, 0.44)",
    value: 60,
    valueColor: "#E51355",
  },
  {
    label: "Inferential",
    badge: "I",
    badgeColor: "#0D7AE7",
    badgeBg: "#B8D8FC",
    value: 60,
    valueColor: "#0D7AE7",
  },
  {
    label: "Critical",
    badge: "L",
    badgeColor: "#1CC777",
    badgeBg: "#8EE5BC",
    value: 60,
    valueColor: "#1CC777",
  },
]

export default function ComprehensionBreakdownReport({
  score,
  literal,
  inferential,
  critical,
  mistakes,
  numberOfItems,
  classificationLevel,
}: ComprehensionBreakdownReportProps) {
  const items: BreakdownItem[] = [
    { ...BREAKDOWN_ITEMS[0], value: literal },
    { ...BREAKDOWN_ITEMS[1], value: inferential },
    { ...BREAKDOWN_ITEMS[2], value: critical },
  ]

  return (
    <div className="bg-[#EFFDFF] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-2xl p-6">
      {/* Header row */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-[#003366]">
            Comprehension Breakdown
          </h3>
          <p
            className="text-lg font-medium"
            style={{ color: "rgba(40, 19, 19, 0.71)", fontFamily: "Nunito, sans-serif" }}
          >
            Total Seats
          </p>
        </div>
        <div className="text-right">
          <span
            className="text-[15px] text-[#162DB0]"
            style={{ fontFamily: "Kanit, sans-serif" }}
          >
            Score
          </span>
          <p
            className="text-[23px] font-semibold text-[#2A2AD0]"
            style={{ fontFamily: "Kanit, sans-serif" }}
          >
            {score}
          </p>
        </div>
      </div>

      {/* Breakdown items */}
      <div className="flex flex-col mt-4">
        {items.map((item, index) => (
          <div key={item.label}>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                {/* Color badge */}
                <div
                  className="flex h-[34px] w-[35px] items-center justify-center rounded-[5px] text-lg font-bold"
                  style={{
                    background: item.badgeBg,
                    border: "1px solid #DAE6FF",
                    color: item.badgeColor,
                  }}
                >
                  {item.badge}
                </div>
                {/* Label */}
                <span className="text-[17px] font-bold text-[#31318A]">
                  {item.label}
                </span>
              </div>
              {/* Value + menu */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span
                    className="text-[10px] text-[#162DB0] block"
                    style={{ fontFamily: "Kanit, sans-serif" }}
                  >
                    Words
                  </span>
                  <span
                    className="text-[23px] font-semibold"
                    style={{ color: item.valueColor, fontFamily: "Kanit, sans-serif" }}
                  >
                    {item.value}
                  </span>
                </div>
                <MoreVertical className="h-4 w-4 text-[#00454D]" />
              </div>
            </div>
            {/* Divider */}
            {index < items.length - 1 && (
              <div className="h-px" style={{ background: "rgba(18, 48, 220, 0.25)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Summary rows */}
      <div className="mt-4 flex flex-col">
        {/* Mistakes */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: "rgba(237, 232, 234, 0.69)" }}
        >
          <span className="text-[17px] font-bold text-[#31318A]">Mistakes</span>
          <span
            className="text-[22px] font-semibold text-[#2E2EA3]"
            style={{ fontFamily: "Kanit, sans-serif" }}
          >
            {mistakes}
          </span>
        </div>

        {/* Number of Items */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: "#EFFAED" }}
        >
          <span className="text-[17px] font-bold text-[#31318A]">Number of Items</span>
          <span
            className="text-[22px] font-semibold text-[#2E2EA3]"
            style={{ fontFamily: "Kanit, sans-serif" }}
          >
            {numberOfItems}
          </span>
        </div>

        {/* Classification Level */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: "#DFFDEA" }}
        >
          <span className="text-[17px] font-bold text-[#31318A]">Classification Level</span>
          <span
            className="text-[22px] font-semibold text-[#2E2EA3]"
            style={{ fontFamily: "Kanit, sans-serif" }}
          >
            {classificationLevel}
          </span>
        </div>
      </div>
    </div>
  )
}
