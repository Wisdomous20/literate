// "use client";

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Loader2, ArrowLeft, ChevronDown } from "lucide-react";
// import { ClassCard } from "@/components/dashboard/classCard";
// import { DashboardHeader } from "@/components/dashboard/dashboardHeader";

// type ClassCardVariant = "blue" | "yellow" | "cyan";

// function getVariant(index: number): ClassCardVariant {
//   const variants: ClassCardVariant[] = ["blue", "yellow", "cyan"];
//   return variants[index % variants.length];
// }

// export interface ClassItem {
//   id: string;
//   name: string;
//   studentCount: number;
//   createdAt?: string;
//   schoolYear?: string;
//   currentYear?: string;
// }

// interface AllClassesPageProps {
//   allClasses: ClassItem[];
//   isLoading: boolean;
//   error: string | null;
//   refetch?: () => Promise<void>;
//   schoolYears: string[];
//   selectedYear: string;
//   onYearChange: (year: string) => void;
//   onCreateClass?: () => void;
//   nextYear?: string;
//   isNextYearDisabled?: boolean;
//   showToast?: (message: string, type: "success" | "error") => void;
//   currentYear?: string; 
// }

// export default function AllClassesPage({
//   allClasses,
//   isLoading,
//   error,
//   schoolYears,
//   selectedYear,
//   onYearChange,
//   onCreateClass,
//   refetch,
//   nextYear,
//   isNextYearDisabled,
//   showToast,
//   currentYear,
// }: AllClassesPageProps) {
//   const router = useRouter();
//   const [showLatest, setShowLatest] = useState(true);
//   const [showOld, setShowOld] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const latestClasses = allClasses.slice(0, 3);
//   const oldClasses = allClasses.slice(3);

//   const handleClassClick = (classId: string) => {
//     router.push(`/dashboard/class/${classId}`);
//     if (showToast) showToast("Navigated to class details.", "success");
//   };

//   return (
//     <div className="flex min-h-full flex-col overflow-y-auto">
//       <DashboardHeader title="Class Inventory" />

//       <div className="w-full px-4 sm:px-6 py-6 lg:px-8">
//         <div className="flex flex-row items-center justify-between gap-4 mb-6">
//           <div className="flex items-center gap-3">
//             <button
//               onClick={() => router.push("/dashboard")}
//               className="flex items-center gap-2 rounded-full p-2 hover:bg-gray-100 transition-colors"
//               aria-label="Back to Dashboard"
//             >
//               <ArrowLeft className="h-5 w-5 text-[#00306E]" />
//               <span className="text-[#00306E] font-medium text-sm">
//                 Back to Dashboard
//               </span>
//             </button>
//           </div>

//           <div className="flex items-center gap-3">
//             <div className="relative">
//               <button
//                 type="button"
//                 onClick={() => setDropdownOpen((open) => !open)}
//                 className="rounded-lg border border-[#6666FF]/25 bg-[#6666FF]/8 px-5 py-2 text-sm font-medium text-[#6666FF] flex items-center gap-1 h-10 min-w-30"
//               >
//                 {selectedYear}
//                 <ChevronDown className="h-4 w-4" />
//               </button>

//               {dropdownOpen && (
//                 <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
//                   {schoolYears.map((year) => {
//                     const isCurrent = year === currentYear;
//                     const isNext = nextYear === year;
//                     const disabled = isNext && !!isNextYearDisabled;
//                     return (
//                       <button
//                         key={year}
//                         onClick={() => {
//                           if (!disabled) {
//                             onYearChange(year);
//                             setDropdownOpen(false);
//                           }
//                         }}
//                         disabled={disabled}
//                         className={`w-full px-4 py-2 text-left text-sm transition-colors
//                           ${year === selectedYear
//                             ? "font-semibold text-[#6666FF] bg-gray-100"
//                             : "text-[#00306E] hover:bg-[#E4F4FF]"}
//                           ${disabled ? "cursor-not-allowed opacity-60" : ""}
//                         `}
//                       >
//                         {year}
//                         {isCurrent && " (Current)"}
//                         {isNext && isNextYearDisabled && " (Upcoming)"}
//                       </button>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>

//             {onCreateClass && (
//               <button
//                 type="button"
//                 onClick={onCreateClass}
//                 className="rounded-lg border border-[#7A7AFB] bg-[#6666FF] px-5 py-2 text-sm font-medium text-white shadow-[0px_1px_20px_rgba(65,155,180,0.47)] transition-opacity hover:opacity-90 h-10 min-w-30"
//               >
//                 + Create Class
//               </button>
//             )}
//           </div>
//         </div>

//         {isLoading && (
//           <div className="flex items-center justify-center py-12">
//             <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
//           </div>
//         )}

//         {!isLoading && error && (
//           <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
//             {error}
//           </div>
//         )}

//         {!isLoading && !error && allClasses.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-12 text-center">
//             <p className="text-[#00306E]/70 mb-2">No classes found.</p>
//           </div>
//         )}

//         {!isLoading && !error && allClasses.length > 0 && (
//           <div className="space-y-8">
//             <div>
//               <button
//                 className="flex items-center gap-2 mb-2 text-lg font-semibold text-[#00306E] focus:outline-none"
//                 onClick={() => setShowLatest((v) => !v)}
//               >
//                 Latest Classes
//                 <ChevronDown
//                   className={`h-5 w-5 transition-transform ${showLatest ? "rotate-180" : ""}`}
//                 />
//               </button>
//               {showLatest && (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
//                   {latestClasses.map((c, idx) => (
//                     <ClassCard
//                       key={c.id}
//                       classId={c.id}
//                       name={c.name}
//                       studentCount={c.studentCount}
//                       variant={getVariant(idx)}
//                       onClick={() => handleClassClick(c.id)}
//                       onClassUpdated={refetch || (() => {})}
//                     />
//                   ))}
//                 </div>
//               )}
//             </div>
//             {oldClasses.length > 0 && (
//               <div>
//                 <button
//                   className="flex items-center gap-2 mb-2 text-lg font-semibold text-[#00306E] focus:outline-none"
//                   onClick={() => setShowOld((v) => !v)}
//                 >
//                   Old Classes
//                   <ChevronDown
//                     className={`h-5 w-5 transition-transform ${showOld ? "rotate-180" : ""}`}
//                   />
//                 </button>
//                 {showOld && (
//                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
//                     {oldClasses.map((c, idx) => (
//                       <ClassCard
//                         key={c.id}
//                         classId={c.id}
//                         name={c.name}
//                         studentCount={c.studentCount}
//                         variant={getVariant(idx + latestClasses.length)}
//                         onClick={() => handleClassClick(c.id)}
//                         onClassUpdated={refetch || (() => {})}
//                       />
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { ClassCard } from "@/components/dashboard/classCard";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";

type ClassCardVariant = "blue" | "yellow" | "cyan";

function getVariant(index: number): ClassCardVariant {
  const variants: ClassCardVariant[] = ["blue", "yellow", "cyan"];
  return variants[index % variants.length];
}

export interface ClassItem {
  id: string;
  name: string;
  studentCount: number;
  createdAt?: string;
  schoolYear?: string;
  currentYear?: string;
}

interface AllClassesPageProps {
  allClasses: ClassItem[];
  isLoading: boolean;
  error: string | null;
  refetch?: () => Promise<void>;
  schoolYears: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  onCreateClass?: () => void;
  nextYear?: string;
  isNextYearDisabled?: boolean;
  showToast?: (message: string, type: "success" | "error") => void;
  currentYear?: string;
}

const CLASSES_PER_PAGE = 9;

export default function AllClassesPage({
  allClasses,
  isLoading,
  error,
  schoolYears,
  selectedYear,
  onYearChange,
  onCreateClass,
  refetch,
  nextYear,
  isNextYearDisabled,
  showToast,
  currentYear,
}: AllClassesPageProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const organizedClasses = useMemo(() => {
    return allClasses.map((c, idx) => ({
      ...c,
      variant: getVariant(idx),
    }));
  }, [allClasses]);

  const totalPages = Math.max(
    1,
    Math.ceil(organizedClasses.length / CLASSES_PER_PAGE),
  );

  const paginatedClasses = useMemo(() => {
    const start = (currentPage - 1) * CLASSES_PER_PAGE;
    return organizedClasses.slice(start, start + CLASSES_PER_PAGE);
  }, [organizedClasses, currentPage]);

  const handleClassClick = (classRoomId: string) => {
    router.push(`/dashboard/class/${classRoomId}`);
    if (showToast) showToast("Navigated to class details.", "success");
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="flex min-h-full flex-col overflow-y-auto bg-white">
      <DashboardHeader title="Class Inventory" />

      <div className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 rounded-full p-2 transition-colors hover:bg-gray-100"
              aria-label="Back to Dashboard"
              title="Back to Dashboard"
              type="button"
            >
              <ArrowLeft className="h-5 w-5 text-[#00306E]" />
              <span className="text-sm font-medium text-[#00306E]">
                Back to Dashboard
              </span>
            </button>
          </div>

          {/* Year Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="flex h-10 min-w-32 items-center justify-between gap-2 rounded-lg border border-[#6666FF]/25 bg-[#6666FF]/8 px-5 text-sm font-medium text-[#6666FF] transition-colors hover:bg-[#6666FF]/15"
              aria-label="Select school year"
              title="Select school year"
            >
              {selectedYear}
              <ChevronDown className="h-4 w-4" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full z-10 mt-2 w-36 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                {schoolYears.map((year) => {
                  const isCurrent = year === currentYear;
                  const isNext = nextYear === year;
                  const disabled = isNext && !!isNextYearDisabled;
                  return (
                    <button
                      key={year}
                      onClick={() => {
                        if (!disabled) {
                          onYearChange(year);
                          setDropdownOpen(false);
                          setCurrentPage(1);
                        }
                      }}
                      disabled={disabled}
                      className={`block w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                        selectedYear === year
                          ? "bg-[#6666FF] text-white"
                          : "text-[#00306E] hover:bg-[#F0F2FF]"
                      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                      type="button"
                      aria-label={`Select ${year}${isCurrent ? " (Current)" : ""}${isNext && isNextYearDisabled ? " (Upcoming)" : ""}`}
                      title={`Select ${year}${isCurrent ? " (Current)" : ""}${isNext && isNextYearDisabled ? " (Upcoming)" : ""}`}
                    >
                      {year}
                      {isCurrent && " (Current)"}
                      {isNext && isNextYearDisabled && " (Upcoming)"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex min-h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
          </div>
        ) : error ? (
          <div className="flex min-h-96 items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-8">
            <p className="text-center text-sm text-red-600">{error}</p>
          </div>
        ) : organizedClasses.length === 0 ? (
          <div className="flex min-h-96 flex-col items-center justify-center">
            <p className="text-sm text-[#00306E]/60">
              No classes available for {selectedYear}
            </p>
            {onCreateClass && (
              <button
                onClick={onCreateClass}
                className="mt-4 rounded-lg bg-[#6666FF] px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                type="button"
                aria-label="Create First Class"
                title="Create First Class"
              >
                Create First Class
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Classes Grid */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedClasses.map((classItem) => (
                <div
                  key={classItem.id}
                  onClick={() => handleClassClick(classItem.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleClassClick(classItem.id);
                    }
                  }}
                  className="cursor-pointer"
                  aria-label={`View class ${classItem.name}`}
                  title={`View class ${classItem.name}`}
                >
                  <ClassCard
                    {...classItem}
                    classRoomId={classItem.id}
                    onClassUpdated={async () => {
                      if (refetch) await refetch();
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#6666FF]/10 pt-6">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 rounded-lg border border-[#6666FF]/25 bg-white px-4 py-2 text-sm font-semibold text-[#6666FF] transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:bg-[#F8F9FF]"
                  type="button"
                  aria-label="Previous page"
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-sm text-[#00306E]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 rounded-lg border border-[#6666FF]/25 bg-white px-4 py-2 text-sm font-semibold text-[#6666FF] transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:bg-[#F8F9FF]"
                  type="button"
                  aria-label="Next page"
                  title="Next page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}