import { FileText, Clock, ClipboardCheck, type LucideIcon } from "lucide-react";

interface MetricCardsProps {
  wcpm: number;
  readingTime: string;
  classificationLevel: string;
}

interface MetricCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  value: React.ReactNode;
  valueColor: string;
  subtitle: string;
}

function MetricCard({ icon: Icon, iconColor, title, value, valueColor, subtitle }: MetricCardProps) {
  return (
    <div className="flex flex-col items-center justify-center bg-[#EFFDFF] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-2xl p-6 gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-10 h-10 bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF] rounded-lg">
          <Icon size={18} className={iconColor} />
        </div>
        <h3
          className="text-base font-bold text-[#003366] leading-tight"
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </div>
      <p className={`text-4xl font-bold mt-2`} style={{ color: valueColor }}>
        {value}
      </p>
      <p className="text-base text-[#162DB0]" style={{ fontFamily: "var(--font-kanit)" }}>
        {subtitle}
      </p>
    </div>
  );
}

export default function MetricCards({ wcpm, readingTime, classificationLevel }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        icon={FileText}
        iconColor="text-[#162DB0]"
        title="Reading Rate<br/>(WCPM)"
        value={wcpm}
        valueColor="#162DB0"
        subtitle="Words Correct Per Minute"
      />
      <MetricCard
        icon={Clock}
        iconColor="text-[#1A6673]"
        title="Reading<br/>Time"
        value={
          <>
            {readingTime} <span className="text-lg">MIN</span>
          </>
        }
        valueColor="#1A6673"
        subtitle="Minutes"
      />
      <MetricCard
        icon={ClipboardCheck}
        iconColor="text-[#CE330C]"
        title="Fluency<br/>Classification"
        value={<span className="text-2xl italic">{classificationLevel}</span>}
        valueColor="#CE330C"
        subtitle="Oral fluency level"
      />
    </div>
  );
}
