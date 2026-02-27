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

function formatReadingTime(totalSeconds: number): { value: React.ReactNode; subtitle: string } {
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

export default function MetricCards({ wcpm, readingTimeSeconds, classificationLevel }: MetricCardsProps) {
  const readingTime = formatReadingTime(readingTimeSeconds);

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
        value={readingTime.value}
        valueColor="#1A6673"
        subtitle={readingTime.subtitle}
      />
      <MetricCard
        icon={ClipboardCheck}
        iconColor="text-[#CE330C]"
        title="Fluency<br/>Classification"
        value={<span className="text-2xl italic">{classificationLevel}</span>}
        valueColor="#CE330C"
        subtitle=""
      />
    </div>
  );
}
