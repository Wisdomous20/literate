"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { AnimatedSection, AnimatedList } from "./AnimatedSection";

export default function ReadingLevelsSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      {/* Decorative mascot image */}
      <div className="absolute top-0 left-0 -z-10 hidden opacity-40 sm:block">
        <Image
          src="/assets/IMG_18.png"
          alt=""
          width={549}
          height={282}
          className="w-[360px] transition-transform duration-300 hover:scale-110 sm:w-[549px]"
        />
      </div>
      {/* Decorative image top-right */}
      <div className="absolute top-0 right-0 -z-10 hidden opacity-[0.56] sm:block">
        <Image
          src="/assets/IMG_17.png"
          alt=""
          width={670}
          height={741}
          className="w-[420px] transition-transform duration-300 hover:scale-110 sm:w-[670px]"
        />
      </div>

      <AnimatedSection direction="up" delay={0.05}>
        <div className="mb-10 px-6 text-center md:px-12 lg:mb-16 lg:translate-x-24">
          <h2 className="mb-5 text-3xl font-bold sm:text-4xl md:text-5xl lg:mb-6">
            Decoding Student{" "}
            <span className="text-[#6C4EEB]">Reading Levels</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-7 text-[#575E6B] sm:text-lg">
            LiteRate instantly categorizes students into Phil-IRI profiles,
            providing clear paths for class intervention.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedList
        className="flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-5 pb-6 [scrollbar-width:none] sm:gap-5 sm:px-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:px-12 lg:pb-0 [&::-webkit-scrollbar]:hidden"
        itemClassName="w-[calc(100vw-40px)] shrink-0 snap-center lg:w-auto lg:max-w-none"
        carouselControls
        carouselControlsClassName="lg:hidden"
        carouselLabel="levels"
        staggerDelay={0.15}
        baseDelay={0.1}
      >
        {/* Independent */}
        <div className="relative group min-h-[340px] lg:h-[420px]">
          <div className="absolute inset-0 rounded-[10px] translate-y-2 bg-[#28A745]" />
          <div className="relative bg-white rounded-[10px] p-5 sm:p-8 h-full overflow-hidden border border-[#00BD6B] shadow-[0_14px_30px_rgba(40,167,69,0.1)] transition-transform hover:-translate-y-1 active:translate-y-0 lg:shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-start gap-3 mb-5 sm:mb-6">
              <h3 className="text-xl font-bold text-[#28A745]">Independent</h3>
              <span className="shrink-0 text-[10px] font-semibold border border-[#E0E2E6] px-3 py-1 rounded-full">
                SUMMARY
              </span>
            </div>
            <div className="flex flex-col gap-1 mb-2">
              <p className="text-sm font-medium text-[#575E6B]">Fluency: 97 - 100%</p>
              <p className="text-sm font-medium text-[#575E6B]">Comprehension: 80 - 100%</p>
            </div>
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
            <p className="text-sm leading-6 text-[#16181D] mb-7 sm:mb-8">
              The student reads with ease and excellent comprehension. Requires
              enrichment rather than remediation.
            </p>
            <div className="mt-auto">
              <span className="text-[12px] font-bold block mb-2 uppercase text-[#28A745]">
                INTERVENTION SUGGESTION
              </span>
              <div className="bg-[#F9FAFB] p-4 rounded-xl italic text-[12px] leading-5 text-[#16181D]">
                &quot;Focus on high-frequency sight words and phonemic awareness
                drills 3x weekly.&quot;
              </div>
            </div>
            <Image
              src="/assets/IMG_19.png"
              alt=""
              width={330}
              height={310}
              className="absolute bottom-0 right-0 z-0 hidden h-auto w-[330px] opacity-40 sm:block"
            />
          </div>
        </div>

        {/* Instructional */}
        <div className="relative group min-h-[340px] lg:h-[420px]">
          <div className="absolute inset-0 rounded-[10px] translate-y-2 bg-[#1766D6]" />
          <div className="relative bg-white rounded-[12px] p-5 sm:p-8 h-full overflow-hidden border-2 border-[#1766D6] shadow-[0_14px_30px_rgba(23,102,214,0.1)] transition-transform hover:-translate-y-1 active:translate-y-0 lg:shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-start gap-3 mb-5 sm:mb-6">
              <h3 className="text-xl font-bold text-[#1766D6]">Instructional</h3>
              <span className="shrink-0 text-[10px] font-semibold border border-[#E0E2E6] px-3 py-1 rounded-full">
                INSIGHT VIEW
              </span>
            </div>
            <div className="flex flex-col gap-1 mb-2">
              <p className="text-sm font-medium text-[#575E6B]">Fluency: 90 - 96%</p>
              <p className="text-sm font-medium text-[#575E6B]">Comprehension: 59 - 79%</p>
            </div>
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
            <p className="text-sm leading-6 text-[#16181D] mb-7 sm:mb-8">
              The &quot;teaching level.&quot; Student can read with some teacher
              support to improve specific miscues.
            </p>
            <div className="mt-auto">
              <span className="text-[12px] font-bold block mb-2 uppercase text-[#1766D6]">
                INTERVENTION SUGGESTION
              </span>
              <div className="bg-[#F9FAFB] p-4 rounded-xl italic text-[12px] leading-5 text-[#16181D]">
                &quot;Focus on high-frequency sight words and phonemic awareness
                drills 3x weekly.&quot;
              </div>
            </div>
            <Image
              src="/assets/IMG_21.png"
              alt=""
              width={343}
              height={275}
              className="absolute bottom-0 right-0 z-0 hidden w-[343px] opacity-40 sm:block"
            />
          </div>
        </div>

        {/* Frustration */}
        <div className="relative group min-h-[340px] lg:h-[420px]">
          <div className="absolute inset-0 rounded-[10px] translate-y-2 bg-[#DC3545]" />
          <div className="relative bg-white rounded-[12px] p-5 sm:p-8 h-full overflow-hidden border-2 border-[#DC3545] shadow-[0_14px_30px_rgba(220,53,69,0.1)] transition-transform hover:-translate-y-1 active:translate-y-0 lg:shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-start gap-3 mb-5 sm:mb-6">
              <h3 className="text-xl font-bold text-[#DC3545]">Frustration</h3>
              <span className="shrink-0 text-[10px] font-semibold border border-[#E0E2E6] px-3 py-1 rounded-full">
                SUMMARY
              </span>
            </div>
            <div className="flex flex-col gap-1 mb-2">
              <p className="text-sm font-medium text-[#575E6B]">Fluency: 89% below</p>
              <p className="text-sm font-medium text-[#575E6B]">Comprehension: 58% below</p>
            </div>
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
            <p className="text-sm leading-6 text-[#16181D] mb-7 sm:mb-8">
              The student finds the text too difficult. Immediate intervention
              and intensive support are needed.
            </p>
            <div className="mt-auto">
              <span className="text-[12px] font-bold block mb-2 uppercase text-[#DC3545]">
                INTERVENTION SUGGESTION
              </span>
              <div className="bg-[#F9FAFB] p-4 rounded-xl italic text-[12px] leading-5 text-[#16181D]">
                &quot;Focus on high-frequency sight words and phonemic awareness
                drills 3x weekly.&quot;
              </div>
            </div>
            <Image
              src="/assets/IMG_20.png"
              alt=""
              width={285}
              height={302}
              className="absolute bottom-0 right-0 z-0 hidden w-[285px] opacity-40 sm:block"
            />
          </div>
        </div>
      </AnimatedList>
    </section>
  );
}
