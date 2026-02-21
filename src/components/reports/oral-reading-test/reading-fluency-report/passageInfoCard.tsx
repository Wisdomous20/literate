import { FileText } from "lucide-react";

interface PassageInfoCardProps {
  passageTitle: string;
  passageLevel: string;
  numberOfWords: number;
  testType: string;
  assessmentType: string;
}

function PassageField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <FileText size={12} className="text-[#162DB0]" />
        <span className="text-xs font-semibold text-[#0C1534]">{label}</span>
      </div>
      <div className="px-4 py-1 bg-[rgba(93,114,142,0.09)] border border-[rgba(18,48,220,0.03)] rounded-full">
        <span className="text-[10px] font-medium text-[#00306E]">{value}</span>
      </div>
    </div>
  );
}

export default function PassageInfoCard({
  passageTitle,
  passageLevel,
  numberOfWords,
  testType,
  assessmentType,
}: PassageInfoCardProps) {
  return (
    <div className="bg-[#EFFDFF] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <FileText size={16} className="text-[#0084E9]" />
        <h3 className="text-[13px] font-medium text-[#00306E]">Passage Information</h3>
      </div>
      <div className="border-b border-[#1230DC] mb-4" />

      {/* Fields */}
      <div className="flex flex-col gap-3">
        <PassageField label="Passage Title" value={passageTitle} />
        <PassageField label="Passage Level" value={passageLevel} />
        <PassageField label="Number of Words" value={String(numberOfWords)} />
        <PassageField label="Test Type" value={testType} />
        <PassageField label="Assessment Type" value={assessmentType} />
      </div>
    </div>
  );
}
