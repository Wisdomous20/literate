"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArchiveRestore,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { ToastNotification } from "@/components/oral-reading-test/toastNotification";
import { updateClass } from "@/app/actions/class/updateClass";
import { useArchivedClassList } from "@/lib/hooks/useArchivedClassList";
import { getSchoolYear } from "@/utils/getSchoolYear";

function getNextSchoolYear(): string {
  const [startYear] = getSchoolYear().split("-").map(Number);
  return `${startYear + 1}-${startYear + 2}`;
}

function getPreviousSchoolYear(): string {
  const [startYear] = getSchoolYear().split("-").map(Number);
  return `${startYear - 1}-${startYear}`;
}

const CLASSES_PER_PAGE = 10;

export default function ArchivedClassesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentYear = getSchoolYear();
  const nextYear = getNextSchoolYear();
  const previousYear = getPreviousSchoolYear();
  const years = useMemo(
    () => Array.from(new Set([nextYear, currentYear, previousYear])).sort((a, b) => b.localeCompare(a)),
    [currentYear, nextYear, previousYear],
  );

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const {
    data: archivedClasses = [],
    isLoading,
    error,
  } = useArchivedClassList(selectedYear);

  const filteredClasses = useMemo(
    () =>
      archivedClasses.filter((classItem) =>
        classItem.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [archivedClasses, searchQuery],
  );

  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / CLASSES_PER_PAGE));
  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * CLASSES_PER_PAGE,
    currentPage * CLASSES_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear, archivedClasses.length]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRestore = async (classId: string) => {
    try {
      setRestoringId(classId);
      const result = await updateClass(classId, undefined, false);

      if (!result.success) {
        showToast(result.error || "Failed to restore class.", "error");
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["archived-classes", selectedYear] }),
        queryClient.invalidateQueries({ queryKey: ["classes", selectedYear] }),
      ]);
      showToast("Class restored successfully!", "success");
    } catch (err) {
      console.error("Failed to restore class:", err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="flex min-h-full flex-col overflow-y-auto dashboard-scroll">
      <DashboardHeader title="Archived Classes" />

      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#9999FF]/25 bg-white p-4 shadow-[0_4px_16px_rgba(102,102,255,0.08)] md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard/class/all")}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#6666FF]/40 bg-white px-4 py-2 text-xs font-semibold text-[#6666FF] transition-transform hover:bg-[#F0F4FF] hover:-translate-y-0.5 active:translate-y-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <div>
                <h1 className="text-base font-bold text-[#00306E] md:text-lg">Archived Classes</h1>
                <p className="text-xs font-semibold text-[#6666FF]">
                  Restore archived classes back to active inventory.
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#6666FF]/25 bg-[#6666FF]/8 px-4 text-sm font-semibold text-[#6666FF]"
              >
                {selectedYear}
                <ChevronDown className="h-4 w-4" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setSelectedYear(year);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        year === selectedYear
                          ? "bg-gray-100 font-semibold text-[#6666FF]"
                          : "text-[#00306E] hover:bg-[#E4F4FF]"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-h-10 flex-1 items-center gap-2 rounded-full border border-[#6666FF] bg-[#F8F9FF] px-4 py-2">
              <Search className="h-4 w-4 shrink-0 text-[#6666FF]/70" />
              <input
                type="text"
                placeholder="Search archived classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#00306E] placeholder-[#00306E]/40 outline-none"
              />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DAE6FF] bg-[#F8FBFF] px-3 py-2">
              <ArchiveRestore className="h-3.5 w-3.5 text-[#6666FF]" />
              <span className="text-xs font-semibold text-[#3B2F7F]">
                {archivedClasses.length} archived
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-dashed border-[#DDE3FF] bg-[#FCFCFF] px-4 py-10 text-center text-sm font-medium text-[#00306E]/60">
              Loading archived classes...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-dashed border-[#FFD2D2] bg-[#FFF7F7] px-4 py-10 text-center text-sm font-medium text-[#A11B1B]">
              {(error as Error).message || "Failed to load archived classes."}
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#DDE3FF] bg-[#FCFCFF] px-4 py-10 text-center text-sm font-medium text-[#00306E]/60">
              No archived classes found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#DDE3FF]">
              <table className="min-w-full bg-white">
                <thead className="bg-[#F5F7FF]">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#3B2F7F]">Class</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#3B2F7F]">Students</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#3B2F7F]">School Year</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-[#3B2F7F]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClasses.map((classItem) => (
                    <tr key={classItem.id} className="border-t border-[#EEF1FF]">
                      <td className="px-4 py-3 text-sm font-semibold text-[#00306E]">{classItem.name}</td>
                      <td className="px-4 py-3 text-sm text-[#00306E]/80">
                        {classItem.studentCount} student{classItem.studentCount === 1 ? "" : "s"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#00306E]/80">{classItem.schoolYear}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleRestore(classItem.id)}
                            disabled={restoringId === classItem.id}
                            className="inline-flex items-center gap-1 rounded-md border border-[#10B981]/40 px-2 py-1 text-[11px] font-bold text-[#059669] transition-colors hover:bg-[#ECFDF5] disabled:opacity-50"
                          >
                            <ArchiveRestore className="h-3 w-3" />
                            {restoringId === classItem.id ? "Restoring..." : "Restore"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredClasses.length > CLASSES_PER_PAGE && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-[#6666FF]/25 bg-white px-3 py-2 text-xs font-bold text-[#6666FF] transition-all hover:bg-[#F8F9FF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-[#3B2F7F]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-[#6666FF]/25 bg-white px-3 py-2 text-xs font-bold text-[#6666FF] transition-all hover:bg-[#F8F9FF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
