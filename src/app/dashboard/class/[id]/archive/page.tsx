"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArchiveRestore, CheckCircle, Search, X, XCircle } from "lucide-react";
import { ClassListsHeader } from "@/components/class-lists/classListsHeader";
import { useClassById } from "@/lib/hooks/useClassById";
import { useArchivedStudentsByClassId } from "@/lib/hooks/useArchivedStudentsByClassId";
import { updateStudent } from "@/app/actions/student/updateStudent";

function levelToGrade(level?: number) {
  if (!level) return "Grade 1";
  return `Grade ${level}`;
}

export default function ArchivedStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const classRoomId = params.id as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const { data: classData } = useClassById(classRoomId);
  const {
    data: archivedStudents = [],
    isLoading,
    error,
  } = useArchivedStudentsByClassId(classRoomId);

  const studentsPerPage = 10;
  const filteredStudents = useMemo(
    () =>
      archivedStudents.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [archivedStudents, searchQuery],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / studentsPerPage),
  );
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, archivedStudents.length]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRestore = async (studentId: string) => {
    try {
      setRestoringId(studentId);
      const result = await updateStudent(studentId, undefined, undefined, false);
      if (!result.success) {
        showToast(result.error || "Failed to restore student.", "error");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["archived-students", classRoomId] });
      queryClient.invalidateQueries({ queryKey: ["class", classRoomId] });
      queryClient.invalidateQueries({
        queryKey: ["assessment-summaries", classRoomId],
      });
      showToast("Student restored successfully!", "success");
    } catch (err) {
      console.error("Failed to restore student:", err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-white via-[#F8F9FF] to-[#EEF0FF]">
      <ClassListsHeader />

      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all ${
            toast.type === "success" ? "bg-green-500 shadow-lg" : "bg-red-500 shadow-lg"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {toast.message}
          <button
            onClick={() => setToast(null)}
            className="ml-2"
            aria-label="Close notification"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <main className="flex w-full flex-1 flex-col gap-4 px-4 py-5 md:px-6 md:py-6 xl:px-8">
        <div className="rounded-2xl border border-[#9999FF]/25 bg-white p-4 shadow-[0_4px_16px_rgba(102,102,255,0.08)] md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/class/${classRoomId}`)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#6666FF]/40 bg-white px-4 py-2 text-xs font-semibold text-[#6666FF] transition-transform hover:bg-[#F0F4FF] hover:-translate-y-0.5 active:translate-y-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <div>
                <h1 className="text-base font-bold text-[#00306E] md:text-lg">Archived Students</h1>
                <p className="text-xs font-semibold text-[#6666FF]">
                  {classData?.name ? `Class ${classData.name}` : "Class archive"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[#DAE6FF] bg-[#F8FBFF] px-3 py-1.5">
              <ArchiveRestore className="h-3.5 w-3.5 text-[#6666FF]" />
              <span className="text-xs font-semibold text-[#3B2F7F]">
                {archivedStudents.length} archived
              </span>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-full border border-[#6666FF] bg-[#F8F9FF] px-4 py-2">
            <Search className="h-4 w-4 shrink-0 text-[#6666FF]/70" />
            <input
              type="text"
              placeholder="Search archived students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#00306E] placeholder-[#00306E]/40 outline-none"
            />
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-dashed border-[#DDE3FF] bg-[#FCFCFF] px-4 py-10 text-center text-sm font-medium text-[#00306E]/60">
              Loading archived students...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-dashed border-[#FFD2D2] bg-[#FFF7F7] px-4 py-10 text-center text-sm font-medium text-[#A11B1B]">
              {(error as Error).message || "Failed to load archived students."}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#DDE3FF] bg-[#FCFCFF] px-4 py-10 text-center text-sm font-medium text-[#00306E]/60">
              No archived students found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#DDE3FF]">
              <table className="min-w-full bg-white">
                <thead className="bg-[#F5F7FF]">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#3B2F7F]">Student</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#3B2F7F]">Grade</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-[#3B2F7F]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((student) => (
                    <tr key={student.id} className="border-t border-[#EEF1FF]">
                      <td className="px-4 py-3 text-sm font-semibold text-[#00306E]">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-[#00306E]/80">{levelToGrade(student.level)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleRestore(student.id)}
                            disabled={restoringId === student.id}
                            className="inline-flex items-center gap-1 rounded-md border border-[#10B981]/40 px-2 py-1 text-[11px] font-bold text-[#059669] transition-colors hover:bg-[#ECFDF5] disabled:opacity-50"
                          >
                            <ArchiveRestore className="h-3 w-3" />
                            {restoringId === student.id ? "Restoring..." : "Restore"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filteredStudents.length > studentsPerPage && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-[#6666FF]/25 bg-white px-3 py-2 text-xs font-bold text-[#6666FF] transition-all hover:bg-[#F8F9FF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs font-semibold text-[#3B2F7F]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-[#6666FF]/25 bg-white px-3 py-2 text-xs font-bold text-[#6666FF] transition-all hover:bg-[#F8F9FF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
