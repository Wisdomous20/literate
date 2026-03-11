import { FileText, BarChart2, Globe, BookOpen } from "lucide-react";
import { usePassageById } from "@/lib/hooks/usePassageById";

export function PassageDetailsCard({ passageId }: { passageId: string }) {
  const { data: passage, isLoading, error } = usePassageById(passageId);

  if (isLoading) {
    return <div className="text-center py-8">Loading passage...</div>;
  }
  if (error || !passage) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load passage.
      </div>
    );
  }

  const wordCount = passage.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="w-full h-full rounded-2xl bg-white border border-[#E4F4FF] shadow-lg p-6 sm:p-8 flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#31318A]/10">
          <FileText className="h-5 w-5 text-[#31318A]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#31318A] wrap-break-word">{passage.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
              <FileText className="h-3 w-3" />
              {passage.testType === "PRE_TEST" ? "Pre-Test" : "Post-Test"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <BarChart2 className="h-3 w-3" />
              {passage.level === 0 ? "Kindergarten" : `Grade ${passage.level}`}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
              <Globe className="h-3 w-3" />
              {passage.language}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <BookOpen className="h-3 w-3" />
              {wordCount} words
            </span>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-col flex-1">
        <h2 className="text-lg font-semibold text-[#00306E] mb-2">
          Passage Content
        </h2>
        <div className="prose max-w-none text-[#31318A] bg-[#F8FAFF] rounded-xl p-4 border border-[#E4F4FF] overflow-auto flex-1 min-h-32">
          {passage.content}
        </div>
      </div>
    </div>
  );
}