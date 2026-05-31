"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

const assessmentTypes = [
  { label: "Assessment Type", value: "ALL" },
  { label: "Oral Reading", value: "ORAL_READING" },
  { label: "Reading Fluency", value: "READING_FLUENCY" },
  { label: "Comprehension", value: "COMPREHENSION" },
] as const;

const testTypes = [
  { label: "Pre-Test", value: "PRE" },
  { label: "Post-Test", value: "POST" },
] as const;

const languageTypes = [
  { label: "Language", value: "ALL" },
  { label: "English", value: "ENGLISH" },
  { label: "Filipino", value: "FILIPINO" },
] as const;

type AssessmentTypeValue = (typeof assessmentTypes)[number]["value"];
type TestTypeValue = (typeof testTypes)[number]["value"];
type LanguageValue = (typeof languageTypes)[number]["value"];

interface DistributionResponse {
  independent: number;
  instructional: number;
  frustration: number;
}

interface ChartRow {
  name: string;
  value: number;
  color: string;
}

function toChartRows(dist: DistributionResponse): ChartRow[] {
  return [
    { name: "Independent", value: dist.independent, color: "#5D5DFB" },
    { name: "Instructional", value: dist.instructional, color: "#54A4FF" },
    { name: "Frustration", value: dist.frustration, color: "#C44BC4" },
  ];
}

function niceYAxisMax(max: number): number {
  if (max <= 0) return 10;
  const rough = Math.ceil(max * 1.2);
  const magnitude = Math.pow(10, Math.max(0, Math.floor(Math.log10(rough)) - 1));
  return Math.ceil(rough / magnitude) * magnitude;
}

interface ClassificationChartProps {
  schoolYear: string;
}

export function ClassificationChart({ schoolYear }: ClassificationChartProps) {
  const [selectedType, setSelectedType] = useState<AssessmentTypeValue>("ALL");
  const [selectedTestType, setSelectedTestType] = useState<TestTypeValue>("PRE");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageValue>("ALL");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const [distribution, setDistribution] = useState<DistributionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const testDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

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
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      setHasError(false);
      const params = new URLSearchParams({
        schoolYear,
        assessmentType: selectedType,
        testType: selectedTestType,
        ...(selectedLanguage !== "ALL" && { language: selectedLanguage }),
      });
      try {
        const res = await fetch(`/api/dashboard/classification-distribution?${params.toString()}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = (await res.json()) as DistributionResponse;
        if (!cancelled) setDistribution(json);
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [schoolYear, selectedType, selectedTestType, selectedLanguage]);

  useEffect(() => {
    const node = chartContainerRef.current;
    if (!node) return;

    const updateWidth = () => {
      setChartWidth(Math.max(0, Math.floor(node.getBoundingClientRect().width)));
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const chartData = useMemo<ChartRow[]>(
    () => (distribution ? toChartRows(distribution) : toChartRows({ independent: 0, instructional: 0, frustration: 0 })),
    [distribution]
  );

  const yAxisMax = useMemo(
    () => niceYAxisMax(Math.max(...chartData.map((d) => d.value))),
    [chartData]
  );

  const yAxisTicks = useMemo(() => {
    const step = yAxisMax / 4;
    return [0, step, step * 2, step * 3, yAxisMax].map((v) => Math.round(v));
  }, [yAxisMax]);

  const selectedTypeLabel =
    assessmentTypes.find((t) => t.value === selectedType)?.label || "Assessment Type";
  const selectedTestTypeLabel =
    testTypes.find((t) => t.value === selectedTestType)?.label || "Pre-Test";
  const selectedLanguageLabel =
    languageTypes.find((t) => t.value === selectedLanguage)?.label || "Language";

  return (
    <div className="flex h-full flex-col rounded-3xl border-l border-t border-r-[6px] border-b-[6px] border-[#5D5DFB] bg-white p-4 shadow-[0px_0px_20px_1px_rgba(84,164,255,0.35)] md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex flex-col min-w-0">
          <h3 className="text-base md:text-lg font-bold text-[#00306E] truncate">
            Classification Distribution
          </h3>
          <div className="mt-2 flex flex-row flex-wrap items-center gap-2">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-center gap-1 rounded-full border border-dashed px-3 py-2 text-xs font-medium transition-colors sm:w-auto sm:min-h-8 sm:px-2 sm:py-1 sm:text-[11px]",
                    selectedType !== "ALL"
                      ? "bg-[#5D5DFB] text-white border-[#5D5DFB]"
                      : "bg-white text-[#5D5DFB] border-[#5D5DFB] hover:bg-[#E4F4FF]"
                  )}
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                  aria-label="Select assessment type"
                >
                  <span className="truncate">{selectedTypeLabel}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", isDropdownOpen && "rotate-180")} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-full min-w-32 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
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
              <div className="relative" ref={testDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTestDropdownOpen(!isTestDropdownOpen)}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-center gap-1 rounded-full border border-dashed px-3 py-2 text-xs font-medium transition-colors sm:w-auto sm:min-h-8 sm:px-2 sm:py-1 sm:text-[11px]",
                    selectedTestType !== "PRE"
                      ? "bg-[#5D5DFB] text-white border-[#5D5DFB]"
                      : "bg-white text-[#5D5DFB] border-[#5D5DFB] hover:bg-[#E4F4FF]"
                  )}
                  aria-haspopup="listbox"
                  aria-expanded={isTestDropdownOpen}
                  aria-label="Select test type"
                >
                  <span className="truncate">{selectedTestTypeLabel}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", isTestDropdownOpen && "rotate-180")} />
                </button>
                {isTestDropdownOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-full min-w-24 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
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
              <div className="relative" ref={languageDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-center gap-1 rounded-full border border-dashed px-3 py-2 text-xs font-medium transition-colors sm:w-auto sm:min-h-8 sm:px-2 sm:py-1 sm:text-[11px]",
                    selectedLanguage !== "ALL"
                      ? "bg-[#5D5DFB] text-white border-[#5D5DFB]"
                      : "bg-white text-[#5D5DFB] border-[#5D5DFB] hover:bg-[#E4F4FF]"
                  )}
                  aria-haspopup="listbox"
                  aria-expanded={isLanguageDropdownOpen}
                  aria-label="Select language"
                >
                  <span className="truncate">{selectedLanguageLabel}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", isLanguageDropdownOpen && "rotate-180")} />
                </button>
                {isLanguageDropdownOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-full min-w-24 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                    {languageTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setSelectedLanguage(type.value);
                          setIsLanguageDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left text-xs transition-colors hover:bg-[#E4F4FF]",
                          selectedLanguage === type.value
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
      <div ref={chartContainerRef} className="relative h-64 min-h-64 min-w-0 w-full">
        {isLoading ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-[#E4F4FF]" />
        ) : hasError ? (
          <div className="flex h-full items-center justify-center text-sm text-[#00306E]/70">
            Failed to load distribution.
          </div>
        ) : chartWidth > 0 ? (
            <BarChart
              width={chartWidth}
              height={256}
              data={chartData}
              barSize={42}
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
                domain={[0, yAxisMax]}
                ticks={yAxisTicks}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
        ) : (
          <div className="h-full w-full rounded-xl bg-[#F8F9FF]" />
        )}
      </div>
    </div>
  );
}
