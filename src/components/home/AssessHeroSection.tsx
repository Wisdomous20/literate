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
    <section className="relative flex min-h-[calc(100dvh-88px)] flex-col items-center justify-center overflow-hidden pb-12 pt-28 text-center sm:min-h-screen sm:pt-24">


      <div className="mx-auto max-w-4xl px-6 md:px-12">
        {/* Eyebrow label */}
        <motion.div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#B3A4F1] bg-[#F5F3FF] px-4 py-2 text-sm font-semibold text-[#6C4EEB] sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <span className="w-2 h-2 rounded-full bg-[#6C4EEB] animate-pulse" />
          Assessment Suite
        </motion.div>

        {/* Main headline */}
        <motion.h1
          className="mb-5 text-4xl font-bold leading-[1.08] tracking-tight text-[#323743] sm:mb-6 sm:text-5xl lg:text-7xl"
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
          className="mx-auto mb-8 max-w-2xl text-base leading-7 text-[#575E6B] sm:mb-10 sm:text-xl sm:leading-relaxed"
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
          className="mb-10 flex flex-wrap justify-center gap-2.5 sm:mb-12 sm:gap-3"
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
          className="flex flex-col justify-center gap-4 sm:flex-row sm:flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#B3A4F1] rounded-[10px] translate-y-1.5" />
            <Link
              href="/signup"
              className="relative inline-flex min-h-13 w-full items-center justify-center rounded-[10px] bg-[#6C4EEB] px-8 py-4 text-base font-medium text-white transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:px-10 sm:text-lg"
            >
              Get Started Free
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-[#E0E2E6] rounded-[10px] translate-y-1.5" />
            <a
              href="#video"
              className="relative inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-[10px] border-2 border-[#6C4EEB] bg-white px-8 py-4 text-base font-medium text-[#6C4EEB] transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:text-lg"
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
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-[#6C4EEB] opacity-70 sm:block"
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
