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

const data = [
  { name: "Independent", value: 45, color: "#6666FF" },
  { name: "Instructional", value: 45, color: "#54A4FF" },
  { name: "Frustration", value: 45, color: "#00306E" },
];

const assessmentTypes = [
  "Oral Reading Test",
  "Reading Fluency Test",
  "Reading Comprehension Test",
];

export function ClassificationChart() {
  const [selectedType, setSelectedType] = useState(assessmentTypes[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex h-full flex-col rounded-[20px] bg-white p-6 shadow-[0px_0px_20px_1px_rgba(84,164,255,0.35)]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[18px] font-semibold text-[#00306E]">
            Classification Distribution
          </h3>
          <p className="text-sm text-[#00306E]/70">SY 2026-2027</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#00306E]/70">Assessment Type</label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex min-w-[160px] items-center justify-between gap-2 rounded-lg border border-[#5D5DFB]/30 bg-white px-3 py-2 text-sm font-medium text-[#00306E] transition-colors hover:bg-[#E4F4FF]"
            >
              <span className="truncate">{selectedType}</span>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-full rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                {assessmentTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedType(type);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[#E4F4FF] ${
                      selectedType === type
                        ? "font-semibold text-[#6666FF]"
                        : "text-[#00306E]"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="min-h-[200px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barSize={80}
            barGap={50}
            margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
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
                const { x, y, payload } = props;
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
