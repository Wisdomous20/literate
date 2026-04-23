import Link from "next/link";
import Image from "next/image";
import { AnimatedSection } from "./AnimatedSection";

export default function CTASection() {
  return (
    <section className="py-24 px-6 md:px-12">
      <div className="group mx-auto rounded-[40px] p-12 md:p-24 relative overflow-hidden shadow-2xl bg-gradient-to-br from-[#eb4cb6] via-[#6C4EEB] to-[#6C4EEB]">
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
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-8">
              Ready to revolutionize your classroom&apos;s literacy?
            </h2>

            <p className="text-white/80 text-xl mb-10">
              Join hundreds of educators making reading assessments fun, efficient
              and smart!
            </p>

            {/* Trust stats removed */}

            <Link
              href="/signup"
              className="inline-block bg-white border border-[#6C4EEB] text-[#6C4EEB] font-medium text-xl px-12 py-5 rounded-[10px] shadow-lg hover:bg-purple-50 transition-colors backdrop-blur-md text-center"
            >
              Experience LiteRate Today
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
