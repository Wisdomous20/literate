"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const exploreButtonRef = useRef<HTMLDivElement | null>(null);
  const signupButtonRef = useRef<HTMLDivElement | null>(null);
  const artRef = useRef<HTMLDivElement | null>(null);
  const haloRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

      intro
        .fromTo(
          copyRef.current,
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.7 }
        )
        .fromTo(
          headingRef.current,
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.45"
        )
        .fromTo(
          bodyRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4"
        )
        .fromTo(
          actionsRef.current?.children ?? [],
          { opacity: 0, y: 18, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12 },
          "-=0.25"
        )
        .fromTo(
          artRef.current,
          { opacity: 0, x: 48, rotate: 3 },
          { opacity: 1, x: 0, rotate: 0, duration: 0.85 },
          "-=0.7"
        )
        .fromTo(
          haloRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.7 },
          "-=0.55"
        );

      if (exploreButtonRef.current && signupButtonRef.current) {
        gsap.to(exploreButtonRef.current, {
          y: -8,
          duration: 1.35,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.8,
        });

        gsap.to(signupButtonRef.current, {
          y: -10,
          duration: 1.9,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.05,
        });
      }

      if (artRef.current) {
        gsap.to(artRef.current, {
          y: -16,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      if (haloRef.current) {
        gsap.to(haloRef.current, {
          rotate: 8,
          scale: 1.03,
          duration: 3.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          transformOrigin: "50% 50%",
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-center overflow-x-hidden pt-28 pb-12"
    >
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
        <div ref={copyRef} className="z-10">
          <h1
            ref={headingRef}
            className="text-3xl sm:text-5xl lg:text-7xl font-bold text-[#323743] leading-[1.1] tracking-tight mb-6"
          >
            Empowering Smart
            <br />
            <span className="text-[#6C4EEB] italic font-[Inter]">
              LiteRacy
            </span>{" "}
            Assessment for Every Filipino Readers
          </h1>

          <p
            ref={bodyRef}
            className="text-[#575E6B] text-lg leading-relaxed mb-10 max-w-2xl"
          >
            LiteRate automates manual reading assessments aligned with the Philippine Informal Reading Inventory.
          </p>

          <div
            ref={actionsRef}
            className="flex flex-wrap gap-4 -mt-6"
          >
            <div ref={exploreButtonRef} className="relative">
              <div className="absolute inset-0 bg-[#B3A4F1] rounded-[10px] translate-y-1.5" />
              <Link
                href="/assess"
                className="relative inline-flex items-center justify-center bg-[#6C4EEB] text-white font-medium text-lg px-10 py-4 rounded-[10px] hover:-translate-y-0.5 transition-transform active:translate-y-0"
              >
                EXPLORE
              </Link>
            </div>
            <div ref={signupButtonRef} className="relative">
              <div className="absolute inset-0 bg-[#6C4EEB] rounded-[10px] translate-y-1.5" />
              <Link
                href="/signup"
                className="relative inline-flex items-center justify-center bg-white border border-[#6C4EEB] text-[#6C4EEB] font-medium text-lg px-8 py-4 rounded-[10px] hover:-translate-y-0.5 transition-transform active:translate-y-0"
              >
                Get Started for Free
              </Link>
            </div>
          </div>
        </div>

        <div
          ref={artRef}
          className="relative flex justify-end"
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
            ref={haloRef}
            className="absolute inset-0 m-auto w-[87%] max-w-none z-10 pointer-events-none hidden lg:block lg:-translate-x-4 lg:-translate-y-12"
          />
        </div>
      </div>
    </main>
  );
}
