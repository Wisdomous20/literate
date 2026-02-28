import { FileText, ClipboardCheck, type LucideIcon } from "lucide-react"

interface ComprehensionMetricCardsProps {
  percentageGrade: number
  comprehensionLevel: string
}

interface MetricCardProps {
  icon: LucideIcon
  iconColor: string
  title: string
  value: React.ReactNode
  valueColor: string
}

function getLevelColor(level: string): string {
  if (!level) return "#CE330C"
  switch (level.toLowerCase()) {
    case "frustration":
      return "#DC2626"
    case "instructional":
      return "#2563EB"
    case "independent":
      return "#16A34A"
    default:
      return "#CE330C"
  }
}

function MetricCard({ icon: Icon, iconColor, title, value, valueColor }: MetricCardProps) {
  return (
    <div className="flex flex-1 flex-col justify-center bg-[#EFFDFF] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-xl px-4 py-3 gap-1">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF] rounded-md shrink-0">
          <Icon size={14} className={iconColor} />
        </div>
        <h3 className="text-xs font-bold text-[#003366] leading-tight">{title}</h3>
      </div>
      <p className="text-2xl font-bold pl-9" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  )
}

export default function ComprehensionMetricCards({
  percentageGrade,
  comprehensionLevel,
}: ComprehensionMetricCardsProps) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <MetricCard
        icon={FileText}
        iconColor="text-[#1A6673]"
        title="Comprehension Rate"
        value={`${percentageGrade}%`}
        valueColor="#1A6673"
      />
      <MetricCard
        icon={ClipboardCheck}
        iconColor="text-[#CE330C]"
        title="Comprehension Level"
        value={
          <span className="text-xl">{comprehensionLevel}</span>
        }
        valueColor={getLevelColor(comprehensionLevel)}
      />
    </div>
  )
}
