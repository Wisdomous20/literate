import Link from "next/link";
import Image from "next/image";
import { AnimatedSection } from "./AnimatedSection";

export default function AssessCTASection() {
  return (
    <section className="px-6 py-16 sm:py-24 md:px-12">
      <div className="group relative mx-auto overflow-hidden rounded-[24px] bg-gradient-to-br from-[#eb4cb6] via-[#6C4EEB] to-[#6C4EEB] p-6 shadow-2xl sm:rounded-[40px] sm:p-12 md:p-24">
        {/* Decorative mascot right */}
        <div className="pointer-events-none absolute right-[-45%] top-0 flex h-full items-center opacity-20 transition-all duration-500 group-hover:scale-110 group-hover:opacity-30 sm:right-[-15%] sm:opacity-40 sm:group-hover:opacity-70">
          <Image
            src="/assets/IMG_30_1.svg"
            alt=""
            width={1650}
            height={1650}
            className="w-[1320px] h-auto"
          />
        </div>

        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.39] pointer-events-none">
          <Image
            src="/assets/IMG_31.png"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        <AnimatedSection direction="up" delay={0.1}>
          <div className="relative z-10 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-extrabold leading-tight text-white sm:mb-6 sm:text-4xl lg:text-5xl">
              Ready to Start Your First Assessment?
            </h2>

            <p className="mb-8 text-base leading-7 text-white/85 sm:mb-10 sm:text-xl">
              Run a complete Phil-IRI assessment in minutes — no training
              required. Free for every educator.
            </p>

            {/* Buttons */}
            <div className="flex flex-col justify-center gap-4 sm:flex-row sm:flex-wrap">
              {/* Primary — 3D white button */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/40 rounded-[10px] translate-y-1.5" />
                <Link
                  href="/signup"
                  className="relative inline-flex min-h-13 w-full items-center justify-center rounded-[10px] bg-white px-8 py-4 text-base font-bold text-[#6C4EEB] shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:px-10 sm:text-lg"
                >
                  Sign Up Free →
                </Link>
              </div>

              {/* Ghost login */}
              <Link
                href="/login"
                className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-[10px] border-2 border-white/40 px-8 py-4 text-base font-semibold text-white/90 transition-colors hover:bg-white/10 sm:w-auto sm:text-lg"
              >
                Log In
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
