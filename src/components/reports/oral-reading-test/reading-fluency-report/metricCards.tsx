import { FileText, Clock, ClipboardCheck, type LucideIcon } from "lucide-react";

interface MetricCardsProps {
  wcpm: number;
  readingTimeSeconds: number;
  classificationLevel: string;
}

interface MetricCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  value: React.ReactNode;
  valueColorClass: string;
  subtitle: string;
}

function MetricCard({
  icon: Icon,
  iconColor,
  title,
  value,
  valueColorClass,
  subtitle,
}: MetricCardProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[10px] border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-white p-6 shadow-[0_1px_20px_rgba(108,164,239,0.37)]">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#DAE6FF] bg-[rgba(74,74,252,0.06)]">
          <Icon size={18} className={iconColor} />
        </div>
        <h3
          className="text-base font-bold leading-tight text-[#003366]"
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </div>
      <p className={`mt-2 text-4xl font-bold ${valueColorClass}`}>{value}</p>
      <p className="font-kanit text-base text-[#162DB0]">{subtitle}</p>
    </div>
  );
}

function formatReadingTime(
  totalSeconds: number,
): { value: React.ReactNode; subtitle: string } {
  if (totalSeconds >= 3600) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    return {
      value: mins > 0 ? `${hrs}:${mins.toString().padStart(2, "0")}` : String(hrs),
      subtitle: mins > 0 ? "Hours & Minutes" : "Hours",
    };
  }
  if (totalSeconds >= 60) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.round(totalSeconds % 60);
    return {
      value: secs > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : String(mins),
      subtitle: secs > 0 ? "Minutes & Seconds" : "Minutes",
    };
  }
  return {
    value: String(Math.round(totalSeconds)),
    subtitle: "Seconds",
  };
}

export default function MetricCards({
  wcpm,
  readingTimeSeconds,
  classificationLevel,
}: MetricCardsProps) {
  const readingTime = formatReadingTime(readingTimeSeconds);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MetricCard
        icon={FileText}
        iconColor="text-[#162DB0]"
        title="Reading Rate<br/>(WCPM)"
        value={wcpm}
        valueColorClass="text-[#162DB0]"
        subtitle="Words Correct Per Minute"
      />
      <MetricCard
        icon={Clock}
        iconColor="text-[#1A6673]"
        title="Reading<br/>Time"
        value={readingTime.value}
        valueColorClass="text-[#1A6673]"
        subtitle={readingTime.subtitle}
      />
      <MetricCard
        icon={ClipboardCheck}
        iconColor="text-[#CE330C]"
        title="Fluency<br/>Classification"
        value={<span className="text-2xl italic">{classificationLevel}</span>}
        valueColorClass="text-[#CE330C]"
        subtitle=""
      />
    </div>
  );
}