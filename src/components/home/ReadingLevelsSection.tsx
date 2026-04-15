"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { AnimatedSection, AnimatedList } from "./AnimatedSection";

export default function ReadingLevelsSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Alternating background tint */}
      <div className="absolute inset-0 bg-[#F5F3FF]/40 pointer-events-none" />
      {/* Decorative mascot image */}
      <div className="absolute top-0 left-0 -z-10">
        <Image
          src="/assets/IMG_18.png"
          alt=""
          width={549}
          height={282}
          className="w-[549px] transition-transform duration-300 hover:scale-110"
        />
      </div>
      {/* Decorative image top-right */}
      <div className="absolute top-0 right-0 -z-10 opacity-[0.56]">
        <Image
          src="/assets/IMG_17.png"
          alt=""
          width={670}
          height={741}
          className="w-[670px] transition-transform duration-300 hover:scale-110"
        />
      </div>

      <AnimatedSection direction="up" delay={0.05}>
        <div className="px-6 md:px-12 text-center mb-16 translate-x-24">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Decoding Student{" "}
            <span className="text-[#6C4EEB]">Reading Levels</span>
          </h2>
          <p className="text-[#575E6B] text-lg max-w-2xl mx-auto">
            LiteRate instantly categorizes students into Phil-IRI profiles,
            providing clear paths for classroom intervention.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedList className="px-6 md:px-12 grid lg:grid-cols-3 gap-8" staggerDelay={0.15} baseDelay={0.1}>
        {/* Independent */}
        <div className="relative group">
          <div className="absolute inset-0 rounded-[10px] translate-y-2 bg-[#28A745]" />
          <div className="relative bg-white rounded-[10px] p-8 h-full overflow-hidden border border-[#00BD6B] shadow-[0_2px_4px_rgba(0,0,0,0.06)] transition-transform hover:-translate-y-1 active:translate-y-0">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-[#28A745]">Independent</h3>
              <span className="text-[10px] font-semibold border border-[#E0E2E6] px-3 py-1 rounded-full">
                SUMMARY
              </span>
            </div>
            <p className="text-sm font-medium text-[#575E6B] mb-2">97-100% Accuracy</p>
            {/* Progress bar */}
            <div className="w-full bg-[#E8F5E9] rounded-full h-1.5 mb-6 overflow-hidden">
              <motion.div
                className="bg-[#28A745] h-full rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "98%" }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="text-sm text-[#16181D] mb-8">
              The student reads with ease and excellent comprehension. Requires
              enrichment rather than remediation.
            </p>
            <div className="mt-auto">
              <span className="text-[12px] font-bold block mb-2 uppercase text-[#28A745]">
                INTERVENTION SUGGESTION
              </span>
              <div className="bg-[#F9FAFB] p-4 rounded-xl italic text-[12px] text-[#16181D]">
                &quot;Focus on high-frequency sight words and phonemic awareness
                drills 3x weekly.&quot;
              </div>
            </div>
            <Image
              src="/assets/IMG_19.png"
              alt=""
              width={330}
              height={310}
              className="absolute bottom-0 right-0 w-[330px] opacity-50 group-hover:opacity-90 transition-opacity duration-300 z-0"
            />
          </div>
        </div>

        {/* Instructional */}
        <div className="relative group">
          <div className="absolute inset-0 rounded-[10px] translate-y-2 bg-[#1766D6]" />
          <div className="relative bg-white rounded-[12px] p-8 h-full overflow-hidden border-2 border-[#1766D6] shadow-[0_2px_4px_rgba(0,0,0,0.06)] transition-transform hover:-translate-y-1 active:translate-y-0">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-[#1766D6]">Instructional</h3>
              <span className="text-[10px] font-semibold border border-[#E0E2E6] px-3 py-1 rounded-full">
                INSIGHT VIEW
              </span>
            </div>
            <p className="text-sm font-medium text-[#575E6B] mb-2">90-96% Accuracy</p>
            {/* Progress bar */}
            <div className="w-full bg-[#E3F0FF] rounded-full h-1.5 mb-4 overflow-hidden">
              <motion.div
                className="bg-[#1766D6] h-full rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "93%" }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <hr className="border-dashed border-[#E0E2E6] mb-4" />
            <p className="text-sm text-[#16181D] mb-8">
              The &quot;teaching level.&quot; Student can read with some teacher
              support to improve specific miscues.
            </p>
            <div className="mt-auto">
              <span className="text-[12px] font-bold block mb-2 uppercase text-[#1766D6]">
                INTERVENTION SUGGESTION
              </span>
              <div className="bg-[#F9FAFB] p-4 rounded-xl italic text-[12px] text-[#16181D]">
                &quot;Focus on high-frequency sight words and phonemic awareness
                drills 3x weekly.&quot;
              </div>
            </div>
            <Image
              src="/assets/IMG_21.png"
              alt=""
              width={343}
              height={275}
              className="absolute bottom-0 right-0 w-[343px] opacity-50 group-hover:opacity-90 transition-opacity duration-300 z-0"
            />
          </div>
        </div>

        {/* Frustration */}
        <div className="relative group">
          <div className="absolute inset-0 rounded-[10px] translate-y-2 bg-[#DC3545]" />
          <div className="relative bg-white rounded-[12px] p-8 h-full overflow-hidden border-2 border-[#DC3545] shadow-[0_2px_4px_rgba(0,0,0,0.06)] transition-transform hover:-translate-y-1 active:translate-y-0">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-[#DC3545]">Frustration</h3>
              <span className="text-[10px] font-semibold border border-[#E0E2E6] px-3 py-1 rounded-full">
                SUMMARY
              </span>
            </div>
            <p className="text-sm font-medium text-[#575E6B] mb-2">&lt;90% Accuracy</p>
            {/* Progress bar */}
            <div className="w-full bg-[#FDEAEA] rounded-full h-1.5 mb-6 overflow-hidden">
              <motion.div
                className="bg-[#DC3545] h-full rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "65%" }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="text-sm text-[#16181D] mb-8">
              The student finds the text too difficult. Immediate intervention
              and intensive support are needed.
            </p>
            <div className="mt-auto">
              <span className="text-[12px] font-bold block mb-2 uppercase text-[#DC3545]">
                INTERVENTION SUGGESTION
              </span>
              <div className="bg-[#F9FAFB] p-4 rounded-xl italic text-[12px] text-[#16181D]">
                &quot;Focus on high-frequency sight words and phonemic awareness
                drills 3x weekly.&quot;
              </div>
            </div>
            <Image
              src="/assets/IMG_20.png"
              alt=""
              width={285}
              height={302}
              className="absolute bottom-0 right-0 w-[285px] opacity-50 group-hover:opacity-90 transition-opacity duration-300 z-0"
            />
          </div>
        </div>
      </AnimatedList>
    </section>
  );
}
