"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <main className="relative min-h-screen flex flex-col justify-center overflow-x-hidden pt-28 pb-12">
      {/* Decorative gradient */}
      <div className="absolute top-[-39px] left-[-21px] -z-10">
        <Image
          src="/assets/IMG_1.png"
          alt=""
          width={900}
          height={1057}
          className="w-[600px] opacity-40"
        />
      </div>

      <div className="px-6 md:px-12 grid lg:grid-cols-2 gap-12 items-center -mt-12">
        <motion.div
          className="z-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h1
            className="text-3xl sm:text-5xl lg:text-7xl font-bold text-[#323743] leading-[1.1] tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            Empowering Smart
            <br />
            <span className="text-[#6C4EEB] italic font-[Inter]">
              LiteRacy
            </span>{" "}
            Assessment for Every Filipino Readers
          </motion.h1>

          <motion.p
            className="text-[#575E6B] text-lg leading-relaxed mb-10 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            LiteRate automates manual reading assessments aligned with the Philippine Informal Reading Inventory. Generate instant results and
            free up your classroom time for more pedagogical innovation.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#B3A4F1] rounded-[10px] translate-y-1.5" />
              <Link
                href="/assess"
                className="relative inline-flex items-center justify-center bg-[#6C4EEB] text-white font-medium text-lg px-10 py-4 rounded-[10px] hover:-translate-y-0.5 transition-transform active:translate-y-0"
              >
                EXPLORE
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-[#6C4EEB] rounded-[10px] translate-y-1.5" />
              <Link
                href="/signup"
                className="relative inline-flex items-center justify-center bg-white border border-[#6C4EEB] text-[#6C4EEB] font-medium text-lg px-8 py-4 rounded-[10px] hover:-translate-y-0.5 transition-transform active:translate-y-0"
              >
                Get Started for Free
              </Link>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative flex justify-end"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/assets/IMG_33_1.svg"
            alt="Mascot Illustration"
            width={1404}
            height={1404}
            className="w-full max-w-[400px] lg:max-w-none mx-auto relative lg:-translate-x-4 lg:-translate-y-12 lg:scale-[1.26] lg:origin-center"
            priority
          />
          <Image
            src="/assets/IMG_6_5.svg"
            alt=""
            width={650}
            height={650}
            className="absolute inset-0 m-auto w-[87%] max-w-none z-10 pointer-events-none hidden lg:block lg:-translate-x-4 lg:-translate-y-12"
          />
        </motion.div>
      </div>
    </main>
  );
}
