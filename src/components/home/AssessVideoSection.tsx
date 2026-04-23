"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const assessments = [
  {
    id: "oral-reading",
    label: "Oral Reading Test",
    color: "#C41048",
    shadowColor: "#F9A8C0",
    bgFrom: "#C41048",
    bgTo: "#7B0229",
    duration: "2:45",
    teaser: "Detect and classify 8 reading miscue types in real time.",
    description:
      "The Oral Reading Test captures a student reading a passage out loud. LiteRate's engine automatically identifies omissions, mispronunciations, substitutions, repetitions, insertions, transpositions, reversals, and self-corrections — scoring each against the official rubric.",
    covers: [
      "Live miscue detection across all 8 miscue types",
      "Reading Behavior Analysis",
      "Independent / Instructional / Frustration level classification",
    ],
  },
  {
    id: "oral-fluency",
    label: "Oral Fluency Test",
    color: "#1E7A35",
    shadowColor: "#A7F3C0",
    bgFrom: "#1E7A35",
    bgTo: "#0A4A1C",
    duration: "1:30",
    teaser: "Measure reading speed and fluency score in under 2 minutes.",
    description:
      "The Oral Fluency Test captures the student's reading performance out loud and classifies them into three reading level classficiation.",
    covers: [
      "Words Correct Per Minute (WCPM) scoring",
      "Reading Behavior Analysis",
      "Independent / Instructional / Frustration level classification",
    ],
  },
  {
    id: "comprehension",
    label: "Reading Comprehension Test",
    color: "#1766D6",
    shadowColor: "#93C5FD",
    bgFrom: "#1766D6",
    bgTo: "#0A3A80",
    duration: "3:10",
    teaser: "Evaluate understanding with adaptive comprehension questions.",
    description:
      "After reading the passage, the student answers a set of comprehension questions. LiteRate presents questions in the correct Phil-IRI format and automatically scores responses, producing a comprehension percentage and an overall reading level profile.",
    covers: [
      "Structured comprehension question delivery",
      "Automatic scoring with percentage breakdown",
      "Independent / Instructional / Frustration level classification",
    ],
  },
];

export default function AssessVideoSection() {
  const [openId, setOpenId] = useState<string>("oral-reading");

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? "" : id));

  return (
    <section
      id="video"
      className="py-24 bg-[#F5F3FF]/40 relative"
    >
      <div className="px-6 md:px-12">
        <AnimatedSection direction="up" delay={0.05}>
          <div className="text-center mb-16">
            <p className="text-[#6C4EEB] text-sm font-semibold uppercase tracking-widest mb-3">
              Tutorials
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#323743] mb-4">
              Watch Each Assessment
              <br />
              <span className="text-[#6C4EEB]">in Action</span>
            </h2>
            <p className="text-[#575E6B] text-lg max-w-xl mx-auto">
              Click any assessment below to expand its tutorial. See exactly
              what teachers and students experience during each test.
            </p>
          </div>
        </AnimatedSection>

        <div className="max-w-3xl mx-auto space-y-4">
          {assessments.map((a, i) => {
            const isOpen = openId === a.id;
            return (
              <AnimatedSection key={a.id} direction="up" delay={0.08 + i * 0.08}>
                <div className="relative group">
                  {/* 3D shadow backing */}
                  <div
                    className="absolute inset-0 rounded-[14px] translate-y-2 transition-opacity"
                    style={{ background: isOpen ? a.color : a.shadowColor, opacity: isOpen ? 0.9 : 0.6 }}
                  />

                  {/* Card */}
                  <div
                    className={`relative bg-white rounded-[14px] border-2 transition-all duration-300 ${
                      isOpen ? "hover:-translate-y-0.5" : "hover:-translate-y-1 active:translate-y-0"
                    }`}
                    style={{ borderColor: a.color }}
                  >
                    {/* Header — always visible */}
                    <button
                      className="w-full flex items-center justify-between gap-4 p-6 text-left"
                      onClick={() => toggle(a.id)}
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-4">
                        {/* Color badge */}
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-inner"
                          style={{ background: a.color }}
                        >
                          {a.label[0]}
                        </div>
                        <div>
                          <span
                            className="text-[10px] font-black tracking-widest uppercase block mb-0.5"
                            style={{ color: a.color }}
                          >
                            Assessment Type
                          </span>
                          <h3 className="text-lg font-bold text-[#16181D]">
                            {a.label}
                          </h3>
                          {!isOpen && (
                            <p className="text-sm text-[#575E6B] mt-0.5 line-clamp-1">
                              {a.teaser}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Expand chevron */}
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2"
                        style={{ borderColor: a.color, color: a.color }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </button>

                    {/* Expandable content */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: EASE }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6">
                            {/* Divider */}
                            <div className="h-px mb-6" style={{ background: a.color + "33" }} />

                            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 items-start">
                              {/* Left — description + bullets */}
                              <div>
                                <p className="text-[#575E6B] text-sm leading-relaxed mb-6">
                                  {a.description}
                                </p>
                                <ul className="space-y-3">
                                  {a.covers.map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                      <span
                                        className="mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                                        style={{ background: a.color }}
                                      >
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      </span>
                                      <span className="text-sm text-[#323743] font-medium">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Right — video placeholder */}
                              <div className="relative">
                                {/* 3D frame backing */}
                                <div
                                  className="absolute inset-0 rounded-[12px] translate-y-2 translate-x-1"
                                  style={{ background: a.color }}
                                />
                                <div
                                  className="relative rounded-[12px] overflow-hidden border-2"
                                  style={{ borderColor: a.color }}
                                >
                                  {/* 16:9 ratio container */}
                                  <div className="aspect-video relative flex flex-col items-center justify-center"
                                    style={{
                                      background: `linear-gradient(135deg, ${a.bgFrom} 0%, ${a.bgTo} 100%)`,
                                    }}
                                  >
                                    {/* Subtle pattern overlay */}
                                    <div className="absolute inset-0 opacity-10"
                                      style={{
                                        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                                        backgroundSize: "24px 24px",
                                      }}
                                    />

                                    {/* Play button */}
                                    <motion.div
                                      className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.96 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <svg
                                        className="w-6 h-6 translate-x-0.5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                        style={{ color: a.color }}
                                      >
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </motion.div>
                                  </div>

                                  {/* Bottom bar */}
                                  <div
                                    className="flex items-center justify-between px-4 py-3"
                                    style={{ background: a.bgTo }}
                                  >
                                    <span className="text-white text-xs font-bold tracking-wide">
                                      {a.label} Tutorial
                                    </span>
                                    <span className="text-white/60 text-xs font-mono">
                                      ~{a.duration}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
