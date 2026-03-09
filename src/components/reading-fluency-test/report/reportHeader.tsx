"use client";

import { useState } from "react";
import { LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeleteConfirmModal } from "@/components/ui/deleteConfirmModal";
import { NavButton } from "@/components/ui/navButton";

const FLUENCY_SESSION_KEY = "reading-fluency-session";
const COMP_SESSION_KEY = "reading-comprehension-session";

export default function ReportHeader() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleContinueToComprehension = () => {
    try {
      const raw = sessionStorage.getItem(FLUENCY_SESSION_KEY);
      if (raw) {
        const fluencySession = JSON.parse(raw);
        const compSession = {
          studentName: fluencySession.studentName,
          gradeLevel: fluencySession.gradeLevel,
          selectedStudentId: fluencySession.selectedStudentId,
          selectedClassName: fluencySession.selectedClassName,
          selectedPassage: fluencySession.selectedPassage,
        };
        sessionStorage.setItem(COMP_SESSION_KEY, JSON.stringify(compSession));
      }
    } catch {
      /* non-critical — quiz page will handle missing session */
    }
    router.push("/dashboard/reading-comprehension-test/quiz");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar with Export & Delete buttons */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#8D8DEC] shadow-[0_4px_4px_#54A4FF]">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={24} className="text-[#00306E]" />
          <h1 className="text-xl lg:text-2xl font-semibold text-[#00306E]">
            Oral Fluency Test Report
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-5 py-2 bg-[#297CEC] text-white text-xs font-medium rounded-lg border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] hover:bg-[#297CEC]/90 transition-colors"
          >
            Export to PDF
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2 bg-[#DE3B40] text-white text-xs font-medium rounded-lg border border-[#DE3B40] shadow-[0_1px_20px_rgba(108,164,239,0.37)] hover:bg-[#DE3B40]/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => { /* TODO: wire up actual delete handler */ }}
      />

      {/* Previous + Continue to Comprehension */}
      <div className="flex items-center justify-between px-8 pt-2">
        <NavButton onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          <span>Previous</span>
        </NavButton>

        <NavButton onClick={handleContinueToComprehension}>
          <span>Continue to Comprehension</span>
          <ChevronRight size={18} />
        </NavButton>
      </div>
    </div>
  );
}
