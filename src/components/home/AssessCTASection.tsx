import Link from "next/link";
import Image from "next/image";
import { AnimatedSection } from "./AnimatedSection";

export default function AssessCTASection() {
  return (
    <section className="py-24 px-6 md:px-12">
      <div className="group mx-auto rounded-[40px] p-12 md:p-24 relative overflow-hidden shadow-2xl bg-gradient-to-br from-[#eb4cb6] via-[#6C4EEB] to-[#6C4EEB]">
        {/* Decorative mascot right */}
        <div className="absolute top-0 right-[-15%] h-full flex items-center opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500 pointer-events-none">
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
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6">
              Ready to Start Your First Assessment?
            </h2>

            <p className="text-white/80 text-xl mb-10">
              Run a complete Phil-IRI assessment in minutes — no training
              required. Free for every educator.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              {/* Primary — 3D white button */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/40 rounded-[10px] translate-y-1.5" />
                <Link
                  href="/signup"
                  className="relative inline-block bg-white text-[#6C4EEB] font-bold text-lg px-10 py-4 rounded-[10px] hover:-translate-y-0.5 transition-transform active:translate-y-0 shadow-lg"
                >
                  Sign Up Free →
                </Link>
              </div>

              {/* Ghost login */}
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-white/90 font-semibold text-lg px-8 py-4 rounded-[10px] border-2 border-white/40 hover:bg-white/10 transition-colors"
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
