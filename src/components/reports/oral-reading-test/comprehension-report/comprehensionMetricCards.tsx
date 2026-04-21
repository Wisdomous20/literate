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
  valueColorClass: string
}

function getLevelColorClass(level: string): string {
  if (!level) return "text-[#CE330C]"
  switch (level.toLowerCase()) {
    case "frustration":
      return "text-[#DC2626]"
    case "instructional":
      return "text-[#2563EB]"
    case "independent":
      return "text-[#16A34A]"
    default:
      return "text-[#CE330C]"
  }
}

function MetricCard({
  icon: Icon,
  iconColor,
  title,
  value,
  valueColorClass,
}: MetricCardProps) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-1 rounded-[10px] border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-white px-4 py-3 shadow-[0_1px_20px_rgba(108,164,239,0.37)]">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#DAE6FF] bg-[rgba(74,74,252,0.06)]">
          <Icon size={14} className={iconColor} />
        </div>
        <h3 className="text-xs font-bold leading-tight text-[#003366]">{title}</h3>
      </div>
      <p className={`pl-9 text-2xl font-bold ${valueColorClass}`}>
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
    <div className="flex h-full flex-col gap-3">
      <MetricCard
        icon={FileText}
        iconColor="text-[#1A6673]"
        title="Comprehension Rate"
        value={`${percentageGrade}%`}
        valueColorClass="text-[#1A6673]"
      />
      <MetricCard
        icon={ClipboardCheck}
        iconColor="text-[#CE330C]"
        title="Comprehension Level"
        value={<span className="text-xl">{comprehensionLevel}</span>}
        valueColorClass={getLevelColorClass(comprehensionLevel)}
      />
    </div>
  )
}