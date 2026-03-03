import { FileText, Tag, BarChart2, Globe, BookOpen } from "lucide-react";

interface Passage {
  id: string;
  title: string;
  content: string;
  language: string;
  level: number;
  testType: string;
}

export function PassageDetailsCard({ passage }: { passage: Passage }) {
  const wordCount = passage.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E4F4FF] shadow-sm p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#31318A]/10">
          <FileText className="h-5 w-5 text-[#31318A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#31318A]">{passage.title}</h1>
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
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-[#00306E] mb-2">
          Passage Content
        </h2>
        <div className="prose max-w-none text-[#31318A] bg-[#F8FAFF] rounded-lg p-4 border border-[#E4F4FF]">
          {passage.content}
        </div>
      </div>
    </div>
  );
}
