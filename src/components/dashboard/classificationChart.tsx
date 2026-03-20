// "use client";

// import { useState } from "react";
// import { ChevronDown } from "lucide-react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   ResponsiveContainer,
//   Cell,
// } from "recharts";

// const assessmentTypes = [
//   { label: "Oral Reading", value: "ORAL_READING" },
//   { label: "Reading Fluency", value: "READING_FLUENCY" },
//   { label: "Comprehension", value: "COMPREHENSION" },
// ];

// interface ClassificationChartProps {
//   schoolYear: string;
// }

// const mockDataMap: Record<
//   string,
//   { name: string; value: number; color: string }[]
// > = {
//   ORAL_READING: [
//     { name: "Independent", value: 50, color: "#6666FF" },
//     { name: "Instructional", value: 40, color: "#54A4FF" },
//     { name: "Frustration", value: 55, color: "#00306E" },
//   ],
//   READING_FLUENCY: [
//     { name: "Independent", value: 18, color: "#6666FF" },
//     { name: "Instructional", value: 20, color: "#54A4FF" },
//     { name: "Frustration", value: 10, color: "#00306E" },
//   ],
//   COMPREHENSION: [
//     { name: "Independent", value: 12, color: "#6666FF" },
//     { name: "Instructional", value: 22, color: "#54A4FF" },
//     { name: "Frustration", value: 14, color: "#00306E" },
//   ],
// };

// export function ClassificationChart({ schoolYear }: ClassificationChartProps) {
//   const [selectedType, setSelectedType] = useState(assessmentTypes[0].value);
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);

//   const selectedTypeLabel =
//     assessmentTypes.find((t) => t.value === selectedType)?.label || "";

//   const data = mockDataMap[selectedType];

//   return (
//     <div className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-[0px_0px_20px_1px_rgba(84,164,255,0.35)]">
//       <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h3 className="text-base font-semibold text-[#00306E]">
//             Classification Distribution
//           </h3>
//           <p className="text-xs text-[#5d5db6]">SY {schoolYear}</p>
//         </div>
//         <div className="flex flex-col gap-1 min-w-30">
//           <span className="text-xs text-[#00306E]/70 mb-0.5">
//             Assessment Type
//           </span>
//           <div className="relative">
//             <button
//               type="button"
//               onClick={() => setIsDropdownOpen((open) => !open)}
//               className={`flex items-center justify-between gap-2 rounded-full border border-dashed border-[#6666FF]/60 px-2 py-0.5 text-[11px] font-medium min-w-28 h-7 transition-all ${
//                 !isDropdownOpen && selectedType
//                   ? "bg-[#afafef3e] text-[#00306E]"
//                   : "bg-transparent text-[#00306E] hover:border-[#6666FF] hover:bg-[#EEEEFF]"
//               }`}
//               aria-haspopup="listbox"
//               aria-expanded={isDropdownOpen}
//               aria-label="Select assessment type"
//             >
//               <span className="truncate">{selectedTypeLabel}</span>
//               <ChevronDown className="h-3 w-3 shrink-0" />
//             </button>
//             {isDropdownOpen && (
//               <div className="absolute right-0 top-full z-10 mt-1 w-full rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
//                 {assessmentTypes.map((type) => (
//                   <button
//                     key={type.value}
//                     type="button"
//                     onClick={() => {
//                       setSelectedType(type.value);
//                       setIsDropdownOpen(false);
//                     }}
//                     className={`w-full px-3 py-2 text-left text-[11px] transition-colors hover:bg-[#E4F4FF] rounded ${
//                       selectedType === type.value
//                         ? "font-semibold text-[#6666FF] bg-[#EEEEFF]"
//                         : "text-[#00306E]"
//                     }`}
//                   >
//                     {type.label}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//       <div className="min-h-0 flex-1">
//         <ResponsiveContainer width="100%" height="100%">
//           <BarChart
//             data={data}
//             barSize={60}
//             margin={{ top: 10, right: 20, left: 0, bottom: 12 }}
//           >
//             <CartesianGrid
//               strokeDasharray="3 3"
//               vertical={false}
//               stroke="#E4F4FF"
//             />
//             <XAxis
//               dataKey="name"
//               axisLine={false}
//               tickLine={false}
//               tick={(props) => {
//                 const x = Number(props.x);
//                 const y = Number(props.y);
//                 const payload = props.payload as { value: string };
//                 const item = data.find((d) => d.name === payload.value);
//                 return (
//                   <g transform={`translate(${x},${y})`}>
//                     <text
//                       x={0}
//                       y={0}
//                       dy={12}
//                       textAnchor="middle"
//                       fill="#00306E"
//                       fontSize={13}
//                       fontWeight={500}
//                     >
//                       {payload.value}
//                     </text>
//                     <text
//                       x={0}
//                       y={0}
//                       dy={30}
//                       textAnchor="middle"
//                       fill="#00306E"
//                       fontSize={14}
//                       fontWeight={600}
//                     >
//                       {item?.value}
//                     </text>
//                   </g>
//                 );
//               }}
//               interval={0}
//             />
//             <YAxis
//               axisLine={false}
//               tickLine={false}
//               tick={{ fill: "#00306E", fontSize: 12 }}
//               domain={[0, 60]}
//               ticks={[0, 15, 30, 45, 60]}
//             />
//             <Bar dataKey="value" radius={[4, 4, 0, 0]}>
//               {data.map((entry, index) => (
//                 <Cell key={`cell-${index}`} fill={entry.color} />
//               ))}
//             </Bar>
//           </BarChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

const assessmentTypes = [
  { label: "Oral Reading", value: "ORAL_READING" },
  { label: "Reading Fluency", value: "READING_FLUENCY" },
  { label: "Comprehension", value: "COMPREHENSION" },
];

const testTypes = [
  { label: "All Tests", value: "ALL" },
  { label: "Pre-Test", value: "PRE_TEST" },
  { label: "Post-Test", value: "POST_TEST" },
];

interface ClassificationChartProps {
  schoolYear: string;
}

const mockDataMap: Record<
  string,
  { name: string; value: number; color: string }[]
> = {
  ORAL_READING: [
    { name: "Independent", value: 50, color: "#6666FF" },
    { name: "Instructional", value: 40, color: "#54A4FF" },
    { name: "Frustration", value: 55, color: "#00306E" },
  ],
  READING_FLUENCY: [
    { name: "Independent", value: 18, color: "#6666FF" },
    { name: "Instructional", value: 20, color: "#54A4FF" },
    { name: "Frustration", value: 10, color: "#00306E" },
  ],
  COMPREHENSION: [
    { name: "Independent", value: 12, color: "#6666FF" },
    { name: "Instructional", value: 22, color: "#54A4FF" },
    { name: "Frustration", value: 14, color: "#00306E" },
  ],
};

export function ClassificationChart({ schoolYear }: ClassificationChartProps) {
  const [selectedType, setSelectedType] = useState(assessmentTypes[0].value);
  const [selectedTestType, setSelectedTestType] = useState(testTypes[0].value);
  const [isAssessmentDropdownOpen, setIsAssessmentDropdownOpen] = useState(false);
  const [isTestTypeDropdownOpen, setIsTestTypeDropdownOpen] = useState(false);

  const selectedTypeLabel =
    assessmentTypes.find((t) => t.value === selectedType)?.label || "";
  const selectedTestTypeLabel =
    testTypes.find((t) => t.value === selectedTestType)?.label || "";

  const data = mockDataMap[selectedType];

  return (
    <div className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-[0px_0px_20px_1px_rgba(84,164,255,0.35)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#00306E]">
            Classification Distribution
          </h3>
          <p className="text-xs text-[#5d5db6]">SY {schoolYear}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center gap-2">
          {/* Assessment Type Filter */}
          <div className="flex flex-col gap-1 min-w-30">
            <span className="text-xs text-[#00306E]/70">Assessment Type</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAssessmentDropdownOpen((open) => !open)}
                className={`flex items-center justify-between gap-2 rounded-full border border-dashed border-[#6666FF]/60 px-2 py-0.5 text-[11px] font-medium min-w-28 h-7 transition-all ${
                  !isAssessmentDropdownOpen && selectedType
                    ? "bg-[#afafef3e] text-[#00306E]"
                    : "bg-transparent text-[#00306E] hover:border-[#6666FF] hover:bg-[#EEEEFF]"
                }`}
                aria-haspopup="listbox"
                aria-expanded={isAssessmentDropdownOpen}
                aria-label="Select assessment type"
              >
                <span className="truncate">{selectedTypeLabel}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </button>
              {isAssessmentDropdownOpen && (
                <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                  {assessmentTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setSelectedType(type.value);
                        setIsAssessmentDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-[11px] transition-colors hover:bg-[#E4F4FF] rounded ${
                        selectedType === type.value
                          ? "font-semibold text-[#6666FF] bg-[#EEEEFF]"
                          : "text-[#00306E]"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Test Type Filter */}
          <div className="flex flex-col gap-1 min-w-30">
            <span className="text-xs text-[#00306E]/70">Test Type</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTestTypeDropdownOpen((open) => !open)}
                className={`flex items-center justify-between gap-2 rounded-full border border-dashed border-[#6666FF]/60 px-2 py-0.5 text-[11px] font-medium min-w-28 h-7 transition-all ${
                  !isTestTypeDropdownOpen && selectedTestType
                    ? "bg-[#afafef3e] text-[#00306E]"
                    : "bg-transparent text-[#00306E] hover:border-[#6666FF] hover:bg-[#EEEEFF]"
                }`}
                aria-haspopup="listbox"
                aria-expanded={isTestTypeDropdownOpen}
                aria-label="Select test type"
              >
                <span className="truncate">{selectedTestTypeLabel}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </button>
              {isTestTypeDropdownOpen && (
                <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                  {testTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setSelectedTestType(type.value);
                        setIsTestTypeDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-[11px] transition-colors hover:bg-[#E4F4FF] rounded ${
                        selectedTestType === type.value
                          ? "font-semibold text-[#6666FF] bg-[#EEEEFF]"
                          : "text-[#00306E]"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barSize={60}
            margin={{ top: 10, right: 20, left: 0, bottom: 12 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E4F4FF"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={(props) => {
                const x = Number(props.x);
                const y = Number(props.y);
                const payload = props.payload as { value: string };
                const item = data.find((d) => d.name === payload.value);
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={12}
                      textAnchor="middle"
                      fill="#00306E"
                      fontSize={13}
                      fontWeight={500}
                    >
                      {payload.value}
                    </text>
                    <text
                      x={0}
                      y={0}
                      dy={30}
                      textAnchor="middle"
                      fill="#00306E"
                      fontSize={14}
                      fontWeight={600}
                    >
                      {item?.value}
                    </text>
                  </g>
                );
              }}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#00306E", fontSize: 12 }}
              domain={[0, 60]}
              ticks={[0, 15, 30, 45, 60]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}