"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

const assessmentTypes = [
  { label: "Assessment Type", value: "ALL" },
  { label: "Oral Reading", value: "ORAL_READING" },
  { label: "Reading Fluency", value: "READING_FLUENCY" },
  { label: "Comprehension", value: "COMPREHENSION" },
];

const testTypes = [
  { label: "Pre-Test", value: "PRE" },
  { label: "Post-Test", value: "POST" },
];

// Mock data for each assessment type and test type
const mockDataMap: Record<
  string,
  Record<string, { name: string; value: number; color: string }[]>
> = {
  ALL: {
    PRE: [
      { name: "Independent", value: 30, color: "#5D5DFB" },
      { name: "Instructional", value: 50, color: "#54A4FF" },
      { name: "Frustration", value: 20, color: "#C44BC4" },
    ],
    POST: [
      { name: "Independent", value: 45, color: "#5D5DFB" },
      { name: "Instructional", value: 60, color: "#54A4FF" },
      { name: "Frustration", value: 25, color: "#C44BC4" },
    ],
  },
  ORAL_READING: {
    PRE: [
      { name: "Independent", value: 40, color: "#5D5DFB" },
      { name: "Instructional", value: 30, color: "#54A4FF" },
      { name: "Frustration", value: 20, color: "#C44BC4" },
    ],
    POST: [
      { name: "Independent", value: 50, color: "#5D5DFB" },
      { name: "Instructional", value: 40, color: "#54A4FF" },
      { name: "Frustration", value: 55, color: "#C44BC4" },
    ],
  },
  READING_FLUENCY: {
    PRE: [
      { name: "Independent", value: 10, color: "#5D5DFB" },
      { name: "Instructional", value: 15, color: "#54A4FF" },
      { name: "Frustration", value: 8, color: "#C44BC4" },
    ],
    POST: [
      { name: "Independent", value: 18, color: "#5D5DFB" },
      { name: "Instructional", value: 20, color: "#54A4FF" },
      { name: "Frustration", value: 10, color: "#C44BC4" },
    ],
  },
  COMPREHENSION: {
    PRE: [
      { name: "Independent", value: 8, color: "#5D5DFB" },
      { name: "Instructional", value: 12, color: "#54A4FF" },
      { name: "Frustration", value: 6, color: "#C44BC4" },
    ],
    POST: [
      { name: "Independent", value: 12, color: "#5D5DFB" },
      { name: "Instructional", value: 22, color: "#54A4FF" },
      { name: "Frustration", value: 14, color: "#C44BC4" },
    ],
  },
};

interface ClassificationChartProps {
  schoolYear: string;
  data?: { name: string; value: number; color: string }[];
}

export function ClassificationChart({ schoolYear, data }: ClassificationChartProps) {
  const [selectedType, setSelectedType] = useState(assessmentTypes[0].value);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedTestType, setSelectedTestType] = useState(testTypes[0].value);
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const testDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        testDropdownRef.current &&
        !testDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTestDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedTypeLabel =
    assessmentTypes.find((t) => t.value === selectedType)?.label || "Assessment Type";
  const selectedTestTypeLabel =
    testTypes.find((t) => t.value === selectedTestType)?.label || "Pre-Test";

  const chartData =
    data || mockDataMap[selectedType][selectedTestType];

  return (
    <div className="flex h-full flex-col rounded-3xl bg-white p-4 md:p-6 shadow-[0px_0px_20px_1px_rgba(84,164,255,0.35)]">
      {/* Header: Title, School Year, Filters */}
      <div className="flex flex-row items-center justify-between flex-wrap mb-4 gap-y-2">
        {/* Left: Title and School Year */}
        <div className="flex flex-col min-w-0">
          <h3 className="text-base md:text-lg font-bold text-[#00306E] truncate">
            Classification Distribution
          </h3>
          <div className="flex flex-row items-center gap-2">
            <p className="text-xs text-[#5D5DFB] whitespace-nowrap">SY {schoolYear}</p>
            {/* Filters directly after school year */}
            <div className="flex flex-row shrink-0 gap-2 max-w-full">
              {/* Assessment Type Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border border-dashed px-2 py-1 text-xs font-medium min-w-22.5 transition-colors",
                    selectedType !== "ALL"
                      ? "bg-[#5D5DFB] text-white border-[#5D5DFB]"
                      : "bg-white text-[#5D5DFB] border-[#5D5DFB] hover:bg-[#E4F4FF]"
                  )}
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                  aria-label="Select assessment type"
                >
                  <span className="truncate">{selectedTypeLabel}</span>
                  <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", isDropdownOpen && "rotate-180")} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-full min-w-32 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                    {assessmentTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setSelectedType(type.value);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left text-xs transition-colors hover:bg-[#E4F4FF]",
                          selectedType === type.value
                            ? "font-semibold text-[#5D5DFB] bg-[#E4F4FF]"
                            : "text-[#00306E]"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Test Type Dropdown */}
              <div className="relative" ref={testDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTestDropdownOpen(!isTestDropdownOpen)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border border-dashed px-2 py-1 text-xs font-medium min-w-22.5 transition-colors",
                    selectedTestType !== "PRE"
                      ? "bg-[#5D5DFB] text-white border-[#5D5DFB]"
                      : "bg-white text-[#5D5DFB] border-[#5D5DFB] hover:bg-[#E4F4FF]"
                  )}
                  aria-haspopup="listbox"
                  aria-expanded={isTestDropdownOpen}
                  aria-label="Select test type"
                >
                  <span className="truncate">{selectedTestTypeLabel}</span>
                  <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", isTestDropdownOpen && "rotate-180")} />
                </button>
                {isTestDropdownOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-full min-w-24 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                    {testTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setSelectedTestType(type.value);
                          setIsTestDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left text-xs transition-colors hover:bg-[#E4F4FF]",
                          selectedTestType === type.value
                            ? "font-semibold text-[#5D5DFB] bg-[#E4F4FF]"
                            : "text-[#00306E]"
                        )}
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
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            barSize={50}
            margin={{ top: 10, right: 10, left: -10, bottom: 30 }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={(props) => {
                const x = Number(props.x);
                const y = Number(props.y);
                const payload = props.payload as { value: string };
                const item = chartData.find((d) => d.name === payload.value);
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={12}
                      textAnchor="middle"
                      fill="#00306E"
                      fontSize={11}
                      fontWeight={500}
                    >
                      {payload.value}
                    </text>
                    <text
                      x={0}
                      y={0}
                      dy={28}
                      textAnchor="middle"
                      fill="#00306E"
                      fontSize={12}
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
              tick={{ fill: "#00306E", fontSize: 11 }}
              domain={[0, 60]}
              ticks={[0, 15, 30, 45, 60]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}