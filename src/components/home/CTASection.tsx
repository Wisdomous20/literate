import Link from "next/link";
import Image from "next/image";
import { AnimatedSection } from "./AnimatedSection";

export default function CTASection() {
  return (
    <section className="px-6 py-16 md:px-12 sm:py-24">
      <div className="group relative mx-auto overflow-hidden rounded-[28px] bg-gradient-to-br from-[#eb4cb6] via-[#6C4EEB] to-[#6C4EEB] p-7 shadow-2xl sm:rounded-[40px] sm:p-12 md:p-24">
        {/* Decorative mascot right */}
        <div className="absolute top-[-65%] right-[-15%] flex items-center opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500 pointer-events-none">
          <Image
            src="/assets/IMG_30_1.svg"
            alt=""
            width={1320}
            height={1320}
            className="w-[1320px] h-auto"
          />
        </div>

        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.39]">
          <Image
            src="/assets/IMG_31.png"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        <AnimatedSection direction="up" delay={0.1}>
          <div className="relative z-10 max-w-2xl text-center">
            <h2 className="mb-5 text-3xl font-extrabold leading-tight text-white sm:mb-8 sm:text-4xl lg:text-5xl">
              Ready to revolutionize your class&apos;s literacy?
            </h2>

            <p className="mb-8 text-base leading-7 text-white/85 sm:mb-10 sm:text-xl">
              Join hundreds of educators making reading assessments fun, efficient
              and smart!
            </p>

            {/* Trust stats removed */}

            <Link
              href="/signup"
              className="inline-flex min-h-13 w-full items-center justify-center rounded-[10px] border border-[#6C4EEB] bg-white px-6 py-4 text-center text-base font-medium text-[#6C4EEB] shadow-lg backdrop-blur-md transition-colors hover:bg-purple-50 sm:w-auto sm:px-12 sm:py-5 sm:text-xl"
            >
              Experience LiteRate Today
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
