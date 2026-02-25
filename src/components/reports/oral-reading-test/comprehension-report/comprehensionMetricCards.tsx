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
  subtitle: string
}

function MetricCard({ icon: Icon, iconColor, title, value, valueColor, subtitle }: MetricCardProps) {
  return (
    <div className="flex flex-col bg-[#EFFDFF] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-2xl p-6 gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-12 h-12 bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF] rounded-[10px]">
          <Icon size={20} className={iconColor} />
        </div>
        <h3 className="text-lg font-bold text-[#003366] leading-tight">{title}</h3>
      </div>
      <p className="text-[43px] font-bold mt-2" style={{ color: valueColor }}>
        {value}
      </p>
      <p
        className="text-lg text-[#162DB0]"
        style={{ fontFamily: "Kanit, sans-serif" }}
      >
        {subtitle}
      </p>
    </div>
  )
}

export default function ComprehensionMetricCards({
  percentageGrade,
  comprehensionLevel,
}: ComprehensionMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MetricCard
        icon={FileText}
        iconColor="text-[#1A6673]"
        title="Percentage Grade"
        value={`${percentageGrade}%`}
        valueColor="#1A6673"
        subtitle="Percentage"
      />
      <MetricCard
        icon={ClipboardCheck}
        iconColor="text-[#CE330C]"
        title="Comprehension Level"
        value={
          <span className="text-[26px]">{comprehensionLevel}</span>
        }
        valueColor="#CE330C"
        subtitle="Comprehension Level"
      />
    </div>
  )
}
