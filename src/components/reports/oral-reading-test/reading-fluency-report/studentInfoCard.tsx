import { User, FileText } from "lucide-react";

interface StudentInfoCardProps {
  studentName: string;
  gradeLevel: string;
  className?: string;
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold text-[#0C1534]">{label}</span>
      </div>
      <div className="px-4 py-1.5 bg-[rgba(108,164,239,0.09)] border border-[rgba(18,48,220,0.3)] rounded-full">
        <span className="text-xs font-medium text-[#00306E]">{value}</span>
      </div>
    </div>
  );
}

export default function StudentInfoCard({ studentName, gradeLevel, className }: StudentInfoCardProps) {
  return (
    <div className="bg-[#EFFDFF] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <User size={18} className="text-[#5D5DFB]" />
        <h3 className="text-sm font-medium text-[#00306E]">Student Information</h3>
        <FileText size={14} className="text-[#0084E9] ml-auto" />
      </div>
      <div className="border-b border-[#1230DC] mb-4" />

      {/* Fields */}
      <div className="flex flex-col gap-4">
        <InfoField
          icon={<FileText size={14} className="text-[#162DB0]" />}
          label="Student Name"
          value={studentName}
        />
        <InfoField
          icon={<FileText size={14} className="text-[#162DB0]" />}
          label="Grade Level"
          value={gradeLevel}
        />
        <InfoField
          icon={<FileText size={14} className="text-[#162DB0]" />}
          label="Class"
          value={className || "—"}
        />
      </div>
    </div>
  );
}
