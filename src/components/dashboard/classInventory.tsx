// "use client";

// import { useState, useMemo } from "react";
// import { ChevronDown, ClipboardList, Loader2 } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { ClassCard } from "./classCard";
// import { CreateClassModal } from "./createClassModal";
// import { createClass } from "@/app/actions/class/createClass";
// import { useQueryClient } from "@tanstack/react-query";
// import { useClassList } from "@/lib/hooks/useClassList";

// type ClassCardVariant = "blue" | "yellow" | "cyan";

// function getCurrentSchoolYear(): string {
//   const now = new Date();
//   const y = now.getFullYear();
//   return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
// }

// function getNextSchoolYear(): string {
//   const [startYear] = getCurrentSchoolYear().split("-").map(Number);
//   return `${startYear + 1}-${startYear + 2}`;
// }

// interface ClassInventoryProps {
//   selectedYear: string;
//   onYearChange: (year: string) => void;
//   showToast?: (message: string, type: "success" | "error") => void;
// }

// function getVariant(index: number): ClassCardVariant {
//   const variants: ClassCardVariant[] = ["blue", "yellow", "cyan"];
//   return variants[index % variants.length];
// }

// export function ClassInventory({
//   selectedYear,
//   onYearChange,
//   showToast,
// }: ClassInventoryProps) {
//   const router = useRouter();
//   const queryClient = useQueryClient();
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const {
//     data: rawClasses,
//     isLoading,
//     error: fetchError,
//   } = useClassList(selectedYear);

//   const error = fetchError?.message ?? null;

//   // Compute available years for dropdown
//   const currentYear = getCurrentSchoolYear();
//   const nextYear = getNextSchoolYear();
//   const now = new Date();
//   const nextYearStart = new Date(Number(nextYear.split("-")[0]), 7, 1); // August 1st of next year
//   const isNextYearDisabled = now < nextYearStart;

//   const yearsWithData = useMemo(() => {
//     const years = [currentYear];
//     if (!years.includes(nextYear)) years.push(nextYear);
//     return years.sort((a, b) => b.localeCompare(a));
//   }, [currentYear, nextYear]);

//   const classes = (rawClasses ?? []).map(
//     (
//       c: { id: string; name: string; studentCount: number },
//       index: number,
//     ): {
//       id: string;
//       name: string;
//       studentCount: number;
//       variant: ClassCardVariant;
//     } => ({
//       id: c.id,
//       name: c.name,
//       studentCount: c.studentCount,
//       variant: getVariant(index),
//     }),
//   );

//   const previewClasses = classes.slice(0, 5);

//   const handleCreateClass = async (data: {
//     className: string;
//     schoolYear: string;
//   }) => {
//     const result = await createClass(data.className);
//     if (result.success) {
//       await queryClient.invalidateQueries({
//         queryKey: ["classes", selectedYear],
//       });
//       showToast?.("Class created successfully!", "success");
//     } else {
//       showToast?.("Failed to create class.", "error");
//     }
//     return result;
//   };

//   const handleClassUpdated = async () => {
//     await queryClient.invalidateQueries({
//       queryKey: ["classes", selectedYear],
//     });
//   };

//   return (
//     <div className="space-y-3">
//       <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//         <div className="flex items-center gap-2">
//           <h2 className="text-[20px] font-semibold text-[#00306E]">
//             Class Inventory
//           </h2>
//           <button
//             type="button"
//             onClick={() => router.push("/dashboard/class/all")}
//             className="rounded-full border border-[#6666FF] bg-transparent px-3 py-1 text-[11px] font-medium text-[#6666ff] ml-1 h-7 min-w-0 hover:bg-[#6666FF]/10 transition-colors"
//           >
//             View All
//           </button>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="relative">
//             <button
//               type="button"
//               onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//               className="rounded-lg border border-[#6666FF]/25 bg-[#6666FF]/8 px-5 py-2 text-sm font-medium text-[#6666FF] flex items-center gap-1 h-10 min-w-30"
//             >
//               {selectedYear}
//               <ChevronDown className="h-4 w-4" />
//             </button>
//             {isDropdownOpen && (
//               <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
//                 {yearsWithData.map((year) => {
//                   const isCurrent = year === currentYear;
//                   const isNext = year === nextYear;
//                   const disabled = isNext && isNextYearDisabled;
//                   return (
//                     <button
//                       key={year}
//                       onClick={() => {
//                         if (!disabled) {
//                           onYearChange(year);
//                           setIsDropdownOpen(false);
//                         }
//                       }}
//                       disabled={disabled}
//                       className={`w-full px-4 py-2 text-left text-sm transition-colors
//                         ${
//                           year === selectedYear
//                             ? "font-semibold text-[#6666FF] bg-gray-100"
//                             : "text-[#00306E] hover:bg-[#E4F4FF]"
//                         }
//                         ${disabled ? "cursor-not-allowed opacity-60" : ""}
//                       `}
//                     >
//                       {year}
//                       {isCurrent && " (Current)"}
//                       {isNext && isNextYearDisabled && " (Upcoming)"}
//                     </button>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//           <button
//             type="button"
//             onClick={() => setIsModalOpen(true)}
//             className="rounded-lg border border-[#7A7AFB] bg-[#6666FF] px-5 py-2 text-sm font-medium text-white shadow-[0px_1px_20px_rgba(65,155,180,0.47)] transition-opacity hover:opacity-90 h-10 min-w-30"
//           >
//             + Create Class
//           </button>
//         </div>
//       </div>

//       <div className="flex items-center gap-2 pl-1 text-[15px] text-[#5d5db6] font-semibold mb-5">
//         <ClipboardList className="w-5 h-5" />
//         Manage your classes for the selected school year.
//       </div>

//       {isLoading && (
//         <div className="flex items-center justify-center py-12">
//           <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
//         </div>
//       )}
//       {!isLoading && error && (
//         <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
//           {error}
//         </div>
//       )}
//       {!isLoading && !error && classes.length === 0 && (
//         <div className="flex flex-col items-center justify-center py-12 text-center">
//           <p className="text-[#00306E]/70 mb-2">
//             No classes found for {selectedYear}
//           </p>
//           <p className="text-sm text-[#00306E]/50">
//             Click Create Class to add your first class
//           </p>
//         </div>
//       )}
//       {!isLoading && !error && previewClasses.length > 0 && (
//         <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
//           {previewClasses.map((classItem) => (
//             <ClassCard
//               key={classItem.id}
//               classId={classItem.id}
//               name={classItem.name}
//               studentCount={classItem.studentCount}
//               variant={classItem.variant}
//               onClick={() => router.push(`/dashboard/class/${classItem.id}`)}
//               onClassUpdated={handleClassUpdated}
//             />
//           ))}
//         </div>
//       )}
//       <CreateClassModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onCreateClass={handleCreateClass}
//         schoolYear={selectedYear}
//       />
//     </div>
//   );
// }

"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ClipboardList, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ClassCard } from "./classCard";
import { CreateClassModal } from "./createClassModal";
import { createClass } from "@/app/actions/class/createClass";
import { useQueryClient } from "@tanstack/react-query";
import { useClassList } from "@/lib/hooks/useClassList";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

type ClassCardVariant = "blue" | "yellow" | "cyan";

function getCurrentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function getNextSchoolYear(): string {
  const [startYear] = getCurrentSchoolYear().split("-").map(Number);
  return `${startYear + 1}-${startYear + 2}`;
}

interface ClassInventoryProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
  showToast?: (message: string, type: "success" | "error") => void;
}

function getVariant(index: number): ClassCardVariant {
  const variants: ClassCardVariant[] = ["blue", "yellow", "cyan"];
  return variants[index % variants.length];
}

export function ClassInventory({
  selectedYear,
  onYearChange,
  showToast,
}: ClassInventoryProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: rawClasses,
    isLoading,
    error: fetchError,
  } = useClassList(selectedYear);

  const error = fetchError?.message ?? null;

  // Compute available years for dropdown
  const currentYear = getCurrentSchoolYear();
  const nextYear = getNextSchoolYear();
  const now = new Date();
  const nextYearStart = new Date(Number(nextYear.split("-")[0]), 7, 1); // August 1st of next year
  const isNextYearDisabled = now < nextYearStart;

  const yearsWithData = useMemo(() => {
    const years = [currentYear];
    if (!years.includes(nextYear)) years.push(nextYear);
    return years.sort((a, b) => b.localeCompare(a));
  }, [currentYear, nextYear]);

  const classes = (rawClasses ?? []).map(
    (
      c: { id: string; name: string; studentCount: number },
      index: number,
    ): {
      id: string;
      name: string;
      studentCount: number;
      variant: ClassCardVariant;
    } => ({
      id: c.id,
      name: c.name,
      studentCount: c.studentCount,
      variant: getVariant(index),
    }),
  );

  // Show all classes in the carousel, not just previewClasses
  // const previewClasses = classes.slice(0, 5);

  const handleCreateClass = async (data: {
    className: string;
    schoolYear: string;
  }) => {
    const result = await createClass(data.className);
    if (result.success) {
      await queryClient.invalidateQueries({
        queryKey: ["classes", selectedYear],
      });
      showToast?.("Class created successfully!", "success");
    } else {
      showToast?.("Failed to create class.", "error");
    }
    return result;
  };

  const handleClassUpdated = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["classes", selectedYear],
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-semibold text-[#00306E]">
            Class Inventory
          </h2>
          <button
            type="button"
            onClick={() => router.push("/dashboard/class/all")}
            className="rounded-full border border-[#6666FF] bg-transparent px-3 py-1 text-[11px] font-medium text-[#6666ff] ml-1 h-7 min-w-0 hover:bg-[#6666FF]/10 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="rounded-lg border border-[#6666FF]/25 bg-[#6666FF]/8 px-5 py-2 text-sm font-medium text-[#6666FF] flex items-center gap-1 h-10 min-w-30"
            >
              {selectedYear}
              <ChevronDown className="h-4 w-4" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                {yearsWithData.map((year) => {
                  const isCurrent = year === currentYear;
                  const isNext = year === nextYear;
                  const disabled = isNext && isNextYearDisabled;
                  return (
                    <button
                      key={year}
                      onClick={() => {
                        if (!disabled) {
                          onYearChange(year);
                          setIsDropdownOpen(false);
                        }
                      }}
                      disabled={disabled}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors
                        ${
                          year === selectedYear
                            ? "font-semibold text-[#6666FF] bg-gray-100"
                            : "text-[#00306E] hover:bg-[#E4F4FF]"
                        }
                        ${disabled ? "cursor-not-allowed opacity-60" : ""}
                      `}
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
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg border border-[#7A7AFB] bg-[#6666FF] px-5 py-2 text-sm font-medium text-white shadow-[0px_1px_20px_rgba(65,155,180,0.47)] transition-opacity hover:opacity-90 h-10 min-w-30"
          >
            + Create Class
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-1 text-[15px] text-[#5d5db6] font-semibold mb-5">
        <ClipboardList className="w-5 h-5" />
        Manage your classes for the selected school year.
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
        </div>
      )}
      {!isLoading && error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {!isLoading && !error && classes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-[#00306E]/70 mb-2">
            No classes found for {selectedYear}
          </p>
          <p className="text-sm text-[#00306E]/50">
            Click Create Class to add your first class
          </p>
        </div>
      )}
      {!isLoading && !error && classes.length > 0 && (
        <div style={{ minHeight: 180, position: "relative" }}>
          <Swiper
            spaceBetween={32}
            grabCursor={true}
            simulateTouch={true}
            loop={true}
            slidesPerView={2}
            breakpoints={{
              640: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
              1280: { slidesPerView: 5 },
            }}
          >
            {classes.map((classItem) => (
              <SwiperSlide key={classItem.id}>
                <ClassCard
                  classRoomId={classItem.id}
                  name={classItem.name}
                  studentCount={classItem.studentCount}
                  variant={classItem.variant}
                  onClick={() =>
                    router.push(`/dashboard/class/${classItem.id}`)
                  }
                  onClassUpdated={handleClassUpdated}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateClass={handleCreateClass}
        schoolYear={selectedYear}
      />
    </div>
  );
}
