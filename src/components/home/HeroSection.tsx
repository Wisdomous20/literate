"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <main className="relative flex flex-col justify-center overflow-x-hidden pb-10 pt-28 sm:pt-36 lg:min-h-screen lg:pt-28">
      {/* Decorative gradient */}
      <div className="absolute top-[-39px] left-[-21px] -z-10">
        <Image
          src="/assets/IMG_1.png"
          alt=""
          width={900}
          height={1057}
          className="w-[420px] opacity-30 sm:w-[600px] sm:opacity-40"
        />
      </div>

      <div className="grid items-center gap-8 px-6 md:px-12 lg:-mt-12 lg:grid-cols-2 lg:gap-12">
        <motion.div
          className="z-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h1
            className="mb-5 max-w-[13ch] text-[2.25rem] font-bold leading-[1.04] tracking-tight text-[#323743] min-[380px]:text-[2.45rem] sm:max-w-none sm:text-5xl lg:text-7xl"
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
            className="mb-8 max-w-2xl text-base leading-7 text-[#575E6B] sm:text-lg sm:leading-relaxed lg:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            LiteRate automates manual reading assessments aligned with the Philippine Informal Reading Inventory.
          </motion.p>

          <motion.div
            className="flex flex-col gap-4 sm:flex-row sm:flex-wrap lg:-mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#B3A4F1] rounded-[10px] translate-y-1.5" />
              <Link
                href="/assess"
                className="relative inline-flex min-h-13 w-full items-center justify-center rounded-[10px] bg-[#6C4EEB] px-8 py-4 text-base font-medium text-white transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:px-10 sm:text-lg"
              >
                EXPLORE
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-[#6C4EEB] rounded-[10px] translate-y-1.5" />
              <Link
                href="/signup"
                className="relative inline-flex min-h-13 w-full items-center justify-center rounded-[10px] border border-[#6C4EEB] bg-white px-8 py-4 text-base font-medium text-[#6C4EEB] transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:text-lg"
              >
                Get Started for Free
              </Link>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative hidden max-h-[320px] justify-center overflow-hidden sm:flex lg:max-h-none lg:justify-end lg:overflow-visible"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/assets/IMG_33_1.svg"
            alt="Mascot Illustration"
            width={1404}
            height={1404}
            className="relative mx-auto h-auto max-h-[320px] w-full max-w-[430px] object-contain lg:max-h-none lg:max-w-none lg:-translate-x-4 lg:-translate-y-12 lg:origin-center lg:scale-[1.26]"
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
