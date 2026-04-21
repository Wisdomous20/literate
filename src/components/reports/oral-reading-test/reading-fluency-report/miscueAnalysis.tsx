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
  onViewMiscues?: () => void;
  onEditMiscues?: () => void;
}

const miscueConfig = [
  {
    key: "mispronunciation" as const,
    label: "Mispronunciation",
    colorClass: "bg-[rgba(253,182,210,0.44)]",
    textClass: "text-[#C41048]",
  },
  {
    key: "omission" as const,
    label: "Omission",
    colorClass: "bg-[rgba(180,170,240,0.4)]",
    textClass: "text-[#4B3BA3]",
  },
  {
    key: "substitution" as const,
    label: "Substitution",
    colorClass: "bg-[rgba(160,200,255,0.4)]",
    textClass: "text-[#1A5FB4]",
  },
  {
    key: "transposition" as const,
    label: "Transposition",
    colorClass: "bg-[rgba(220,120,220,0.4)]",
    textClass: "text-[#8B008B]",
  },
  {
    key: "reversal" as const,
    label: "Reversal",
    colorClass: "bg-[rgba(200,165,130,0.35)]",
    textClass: "text-[#6E4023]",
  },
  {
    key: "insertion" as const,
    label: "Insertion",
    colorClass: "bg-[rgba(140,220,160,0.4)]",
    textClass: "text-[#1E7A35]",
  },
  {
    key: "repetition" as const,
    label: "Repetition",
    colorClass: "bg-[rgba(255,200,140,0.45)]",
    textClass: "text-[#B85C00]",
  },
  {
    key: "selfCorrection" as const,
    label: "Self-Correction",
    colorClass: "bg-[rgba(250,230,140,0.45)]",
    textClass: "text-[#8A6D00]",
  },
];

function getClassificationColorClasses(level: string) {
  switch (level?.toUpperCase()) {
    case "INDEPENDENT":
      return {
        textClass: "text-[#1E7A35]",
        bgClass: "bg-[rgba(140,220,160,0.3)]",
      };
    case "INSTRUCTIONAL":
      return {
        textClass: "text-[#1A5FB4]",
        bgClass: "bg-[rgba(160,200,255,0.3)]",
      };
    case "FRUSTRATION":
      return {
        textClass: "text-[#C41048]",
        bgClass: "bg-[rgba(253,182,210,0.3)]",
      };
    default:
      return {
        textClass: "text-[#2E2EA3]",
        bgClass: "bg-[rgba(230,230,250,0.2)]",
      };
  }
}

export default function MiscueAnalysisReport({
  miscueData,
  onViewMiscues,
  onEditMiscues,
}: MiscueAnalysisProps) {
  const classificationColor = getClassificationColorClasses(
    miscueData.classificationLevel,
  );

  return (
    <div className="flex flex-col rounded-[10px] border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-white p-5 pb-3 shadow-[0_1px_20px_rgba(108,164,239,0.37)]">
      {/* Header */}
      <h3 className="mb-2 text-base font-bold text-[#003366]">
        Miscue Analysis
      </h3>

      {/* Miscue Items */}
      <div className="flex flex-col">
        {miscueConfig.map((item, index) => (
          <div key={item.key}>
            <div className="flex items-center justify-between rounded-md px-1.5 py-1.5">
              {/* Left: count badge */}
              <div
                className={`flex h-6 w-7 shrink-0 items-center justify-center rounded-[5px] border border-[#DAE6FF] text-sm font-bold ${item.colorClass} ${item.textClass}`}
              >
                {miscueData[item.key]}
              </div>
              {/* Right: label */}
              <span className={`text-sm font-bold ${item.textClass}`}>
                {item.label}
              </span>
            </div>
            {index < miscueConfig.length - 1 && (
              <div className="h-px bg-[rgba(18,48,220,0.25)]" />
            )}
          </div>
        ))}
      </div>

      {/* Summary Section */}
      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between rounded bg-[rgba(230,230,250,0.5)] px-3 py-1.5">
          <span className="text-xs font-bold text-[#31318A]">
            Total Miscue:
          </span>
          <span className="font-kanit text-[17px] font-semibold text-[#2E2EA3]">
            {miscueData.totalMiscue}
          </span>
        </div>
        <div className="flex items-center justify-between rounded bg-[rgba(230,230,250,0.35)] px-3 py-1.5">
          <span className="text-xs font-bold text-[#31318A]">
            Oral Fluency Score:
          </span>
          <span className="font-kanit text-[17px] font-semibold text-[#2E2EA3]">
            {miscueData.oralFluencyScore}
          </span>
        </div>
        <div
          className={`flex items-center justify-between rounded px-3 py-1.5 ${classificationColor.bgClass}`}
        >
          <span className="text-xs font-bold text-[#31318A]">
            Classification Level:
          </span>
          <span
            className={`font-kanit text-[17px] font-semibold ${classificationColor.textClass}`}
          >
            {miscueData.classificationLevel}
          </span>
        </div>
      </div>

      {(onViewMiscues || onEditMiscues) && (
        <div className="mt-3 flex justify-center gap-2">
          {onViewMiscues && (
            <button
              type="button"
              onClick={onViewMiscues}
              className="flex-1 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              View Miscues
            </button>
          )}
          {onEditMiscues && (
            <button
              type="button"
              onClick={onEditMiscues}
              className="flex-1 rounded-lg border border-[#6666FF] px-4 py-2 text-sm font-medium text-[#6666FF] transition-colors hover:bg-[#6666FF]/10"
            >
              Edit Miscues
            </button>
          )}
        </div>
      )}
    </div>
  );
}