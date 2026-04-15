import Link from "next/link";
import Image from "next/image";
import { AnimatedSection } from "./AnimatedSection";

export default function CTASection() {
  return (
    <section className="py-24 px-6 md:px-12">
      <div className="group mx-auto rounded-[40px] p-12 md:p-24 relative overflow-hidden shadow-2xl bg-gradient-to-br from-[#eb4cb6] via-[#6C4EEB] to-[#6C4EEB]">
        {/* Decorative mascot right */}
        <div className="absolute top-0 right-0 h-full w-[1100px] opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500 pointer-events-none translate-x-72">
          <Image
            src="/assets/IMG_30.png"
            alt=""
            fill
            className="object-contain object-right scale-x-[-1]"
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

            {/* Trust stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              {[
                { value: "12,000+", label: "Assessments Run" },
                { value: "300+", label: "Educators Onboarded" },
                { value: "98%", label: "Accuracy Rate" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-black text-white">{s.value}</div>
                  <div className="text-white/70 text-xs uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </div>

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
