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
  { key: "mispronunciation" as const, label: "Mispronunciation", color: "rgba(253, 182, 210, 0.44)", textColor: "#C41048" },
  { key: "omission" as const, label: "Omission", color: "rgba(180, 170, 240, 0.4)", textColor: "#4B3BA3" },
  { key: "substitution" as const, label: "Substitution", color: "rgba(160, 200, 255, 0.4)", textColor: "#1A5FB4" },
  { key: "transposition" as const, label: "Transposition", color: "rgba(220, 120, 220, 0.4)", textColor: "#8B008B" },
  { key: "reversal" as const, label: "Reversal", color: "rgba(200, 165, 130, 0.35)", textColor: "#6E4023" },
  { key: "insertion" as const, label: "Insertion", color: "rgba(140, 220, 160, 0.4)", textColor: "#1E7A35" },
  { key: "repetition" as const, label: "Repetition", color: "rgba(255, 200, 140, 0.45)", textColor: "#B85C00" },
  { key: "selfCorrection" as const, label: "Self-Correction", color: "rgba(250, 230, 140, 0.45)", textColor: "#8A6D00" },
];

function getClassificationColor(level: string) {
  switch (level?.toUpperCase()) {
    case "INDEPENDENT": return { text: "#1E7A35", bg: "rgba(140, 220, 160, 0.3)" };
    case "INSTRUCTIONAL": return { text: "#1A5FB4", bg: "rgba(160, 200, 255, 0.3)" };
    case "FRUSTRATION": return { text: "#C41048", bg: "rgba(253, 182, 210, 0.3)" };
    default: return { text: "#2E2EA3", bg: "rgba(230, 230, 250, 0.2)" };
  }
}

export default function MiscueAnalysisReport({ miscueData }: MiscueAnalysisProps) {
  const classificationColor = getClassificationColor(miscueData.classificationLevel);

  return (
    <div className="bg-[#EFFDFF] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-2xl p-5 pb-3 flex flex-col">
      {/* Header */}
      <h3 className="text-base font-bold text-[#003366] mb-2">
        Miscue Analysis
      </h3>

      {/* Miscue Items */}
      <div className="flex flex-col">
        {miscueConfig.map((item, index) => (
          <div key={item.key}>
            <div className="flex items-center justify-between rounded-md px-1.5 py-1.5">
              {/* Left: count badge */}
              <div
                className="flex h-6 w-7 shrink-0 items-center justify-center rounded-[5px] text-sm font-bold"
                style={{
                  background: item.color,
                  border: "1px solid #DAE6FF",
                  color: item.textColor,
                }}
              >
                {miscueData[item.key]}
              </div>
              {/* Right: label */}
              <span
                className="text-sm font-bold"
                style={{ color: item.textColor }}
              >
                {item.label}
              </span>
            </div>
            {index < miscueConfig.length - 1 && (
              <div className="h-px" style={{ background: "rgba(18, 48, 220, 0.25)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Summary Section */}
      <div className="mt-3 flex flex-col gap-1.5">
        <div
          className="flex items-center justify-between rounded px-3 py-1.5"
          style={{ background: "rgba(230, 230, 250, 0.5)" }}
        >
          <span className="text-xs font-bold" style={{ color: "#31318A" }}>Total Miscue:</span>
          <span className="text-[17px] font-semibold" style={{ color: "#2E2EA3", fontFamily: "var(--font-kanit)" }}>
            {miscueData.totalMiscue}
          </span>
        </div>
        <div
          className="flex items-center justify-between rounded px-3 py-1.5"
          style={{ background: "rgba(230, 230, 250, 0.35)" }}
        >
          <span className="text-xs font-bold" style={{ color: "#31318A" }}>Oral Fluency Score:</span>
          <span className="text-[17px] font-semibold" style={{ color: "#2E2EA3", fontFamily: "var(--font-kanit)" }}>
            {miscueData.oralFluencyScore}
          </span>
        </div>
        <div
          className="flex items-center justify-between rounded px-3 py-1.5"
          style={{ background: classificationColor.bg }}
        >
          <span className="text-xs font-bold" style={{ color: "#31318A" }}>Classification Level:</span>
          <span className="text-[17px] font-semibold" style={{ color: classificationColor.text, fontFamily: "var(--font-kanit)" }}>
            {miscueData.classificationLevel}
          </span>
        </div>
      </div>
    </div>
  );
}
