import { FileText } from "lucide-react";

export interface MiscueData {
  mispronunciation: number;
  omission: number;
  substitution: number;
  transposition: number;
  reversal: number;
  insertion: number;
  repetition: number;
  selfCorrection: number;
  totalMiscue: number;
  oralFluencyScore: string;
  classificationLevel: string;
}

interface MiscueAnalysisProps {
  miscueData: MiscueData;
}

const miscueConfig = [
  { key: "mispronunciation" as const, label: "Mispronunciation", color: "rgba(253,182,210,0.44)", textColor: "#E51355" },
  { key: "omission" as const, label: "Omission", color: "#B8D8FC", textColor: "#0D7AE7" },
  { key: "substitution" as const, label: "Substitution", color: "#8EE5BC", textColor: "#1CC777" },
  { key: "transposition" as const, label: "Transposition", color: "#F2E3AF", textColor: "#D3AB28" },
  { key: "reversal" as const, label: "Reversal", color: "rgba(27,147,206,0.37)", textColor: "#1B93CE" },
  { key: "insertion" as const, label: "Insertion", color: "#8EE5BC", textColor: "#1CC777" },
  { key: "repetition" as const, label: "Repetition", color: "#F2E3AF", textColor: "#D3AB28" },
  { key: "selfCorrection" as const, label: "Self-Correction", color: "rgba(27,147,206,0.37)", textColor: "#1B93CE" },
];

interface SummaryRowProps {
  label: string;
  value: string;
  bgColor: string;
}

function SummaryRow({ label, value, bgColor }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2" style={{ background: bgColor }}>
      <span className="text-xs font-bold text-[#31318A]">{label}</span>
      <span
        className="text-base font-semibold text-[#2E2EA3]"
        style={{ fontFamily: "var(--font-kanit)" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function MiscueAnalysisReport({ miscueData }: MiscueAnalysisProps) {
  return (
    <div className="bg-[#EFFDFF] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-2xl p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-[#003366]">Miscue Analysis Report</h3>
        <FileText size={16} className="text-[#0084E9]" />
      </div>

      {/* Miscue Items */}
      <div className="flex flex-col">
        {miscueConfig.map((item) => (
          <div key={item.key}>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-5 rounded border border-[#DAE6FF]"
                  style={{ background: item.color }}
                />
                <span className="text-sm font-bold text-[#31318A]">{item.label}</span>
              </div>
              <span
                className="text-lg font-semibold"
                style={{ color: item.textColor, fontFamily: "var(--font-kanit)" }}
              >
                {miscueData[item.key]}
              </span>
            </div>
            <div className="border-b border-[rgba(18,48,220,0.25)]" />
          </div>
        ))}
      </div>

      {/* Summary Section */}
      <div className="mt-3 flex flex-col gap-0 rounded overflow-hidden">
        <SummaryRow label="Total Miscue" value={String(miscueData.totalMiscue)} bgColor="rgba(237,232,234,0.69)" />
        <SummaryRow label="Oral Fluency Score" value={miscueData.oralFluencyScore} bgColor="#EFFAED" />
        <SummaryRow label="Classification Level" value={miscueData.classificationLevel} bgColor="#DFFDEA" />
      </div>
    </div>
  );
}
