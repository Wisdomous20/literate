"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const badges = [
  { label: "Oral Reading Test", color: "#C41048", bg: "#FFF0F3" },
  { label: "Oral Fluency Test", color: "#1E7A35", bg: "#F0FFF4" },
  { label: "Reading Comprehension Test", color: "#1766D6", bg: "#EFF6FF" },
];

export default function AssessHeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-12 text-center">


      <div className="px-6 md:px-12 max-w-4xl mx-auto">
        {/* Eyebrow label */}
        <motion.div
          className="inline-flex items-center gap-2 bg-[#F5F3FF] border border-[#B3A4F1] text-[#6C4EEB] text-sm font-semibold px-4 py-2 rounded-full mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <span className="w-2 h-2 rounded-full bg-[#6C4EEB] animate-pulse" />
          Assessment Suite
        </motion.div>

        {/* Main headline */}
        <motion.h1
          className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[#323743] leading-[1.1] tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
        >
          Understand Every
          <br />
          <span className="text-[#6C4EEB] italic font-[Inter]">
            Student&apos;s
          </span>{" "}
          Reading Level
        </motion.h1>

        {/* Sub-copy */}
        <motion.p
          className="text-[#575E6B] text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
        >
          LiteRate provides three Phil-IRI aligned assessment tools that
          automatically capture, analyze, and report on every dimension of a
          student&apos;s reading performance — in minutes, not hours.
        </motion.p>

        {/* Colored badge row */}
        <motion.div
          className="flex flex-wrap gap-3 justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
        >
          {badges.map((b, i) => (
            <motion.span
              key={b.label}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border"
              style={{ color: b.color, background: b.bg, borderColor: b.color + "33" }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.4 + i * 0.08, ease: EASE }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
              {b.label}
            </motion.span>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#B3A4F1] rounded-[10px] translate-y-1.5" />
            <Link
              href="/signup"
              className="relative inline-flex items-center justify-center bg-[#6C4EEB] text-white font-medium text-lg px-10 py-4 rounded-[10px] hover:-translate-y-0.5 transition-transform active:translate-y-0"
            >
              Get Started Free
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-[#E0E2E6] rounded-[10px] translate-y-1.5" />
            <a
              href="#video"
              className="relative inline-flex items-center justify-center gap-2 bg-white border-2 border-[#6C4EEB] text-[#6C4EEB] font-medium text-lg px-8 py-4 rounded-[10px] hover:-translate-y-0.5 transition-transform active:translate-y-0"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Tutorial
            </a>
          </div>
        </motion.div>
      </div>

      {/* Scroll chevron */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#6C4EEB] opacity-70"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </motion.div>
    </section>
  );
}
