"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  LANDING_REVEAL_TRIGGERS,
  LANDING_SCROLL_SCENES,
  shouldEnableLandingMotion,
} from "./landingScrollScenes";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const EASE_OUT = "power4.out";

export default function LandingScrollEffects() {
  const progressRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const matchMedia = gsap.matchMedia();

    matchMedia.add(
      {
        isDesktop: "(min-width: 1024px)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const isDesktop = Boolean(context.conditions?.isDesktop);
        const reduceMotion = Boolean(context.conditions?.reduceMotion);

        if (!shouldEnableLandingMotion(reduceMotion)) {
          gsap.set(
            [
              "[data-motion-reveal]",
              "[data-motion-item]",
              "[data-reading-card]",
              "[data-miscue-card]",
              "[data-testimonial-card]",
            ].join(","),
            { autoAlpha: 1, clearProps: "transform" },
          );
          return;
        }

        const sections = LANDING_SCROLL_SCENES.flatMap((scene) => {
          const element = document.getElementById(scene.id);
          return element ? [{ ...scene, element }] : [];
        });

        gsap.to(progressRef.current, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.35,
          },
        });

        gsap.to("[data-landing-bg]", {
          yPercent: -8,
          scale: 1.12,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.2,
          },
        });

        sections.forEach((scene, index) => {
          if (index === 0) return;
          if (scene.id === "how-it-works") return;

          const isBrisk = scene.pace === "brisk";

          gsap.fromTo(
            scene.element,
            {
              autoAlpha: 0.55,
              y: isDesktop ? (isBrisk ? 84 : 120) : isBrisk ? 48 : 64,
              scale: isDesktop ? (isBrisk ? 0.97 : 0.94) : 0.98,
            },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: scene.element,
                start: isBrisk
                  ? LANDING_REVEAL_TRIGGERS.sectionBriskStart
                  : LANDING_REVEAL_TRIGGERS.sectionStart,
                end: isBrisk
                  ? LANDING_REVEAL_TRIGGERS.sectionBriskEnd
                  : LANDING_REVEAL_TRIGGERS.sectionEnd,
                scrub: isBrisk ? 0.35 : 0.9,
              },
            },
          );
        });

        const hero = document.getElementById("hero");
        if (hero) {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: 1,
              },
            })
            .to(
              hero.querySelector("[data-hero-copy]"),
              { yPercent: -28, autoAlpha: 0.35, ease: "none" },
              0,
            )
            .to(
              hero.querySelector("[data-hero-art]"),
              {
                yPercent: -22,
                scale: isDesktop ? 1.16 : 1.06,
                rotate: isDesktop ? -4 : 0,
                ease: "none",
              },
              0,
            )
            .to(
              hero.querySelectorAll("[data-hero-orbit]"),
              { yPercent: -45, rotate: 10, ease: "none" },
              0,
            );
        }

        gsap.utils.toArray<HTMLElement>("[data-motion-reveal]").forEach((el) => {
          if (el.closest("#how-it-works")) return;

          const direction = el.dataset.motionDirection;
          const delay = Number(el.dataset.motionDelay ?? 0);
          const isProblem = el.closest("#problem") !== null;

          gsap.fromTo(
            el,
            {
              autoAlpha: 0,
              x: direction === "left"
                ? isProblem ? -56 : -80
                : direction === "right"
                  ? isProblem ? 56 : 80
                  : 0,
              y: direction === "up" || !direction ? (isProblem ? 48 : 72) : 0,
              rotateX: isDesktop ? -10 : 0,
              transformPerspective: 900,
            },
            {
              autoAlpha: 1,
              x: 0,
              y: 0,
              rotateX: 0,
              duration: isProblem ? 0.58 : 1,
              delay,
              ease: EASE_OUT,
              scrollTrigger: {
                trigger: el,
                start: LANDING_REVEAL_TRIGGERS.content,
                toggleActions: "play none none reverse",
              },
            },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-motion-list]").forEach((list) => {
          if (list.closest("#how-it-works, #reading-levels, #miscues")) return;

          const items = list.querySelectorAll("[data-motion-item]");
          const stagger = Number(list.dataset.motionStagger ?? 0.1);
          const delay = Number(list.dataset.motionDelay ?? 0);
          const isProblem = list.closest("#problem") !== null;

          gsap.fromTo(
            items,
            {
              autoAlpha: 0,
              y: isProblem ? 44 : 72,
              scale: isProblem ? 0.96 : 0.92,
              rotateZ: isDesktop ? -2 : 0,
            },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              rotateZ: 0,
              duration: isProblem ? 0.5 : 0.9,
              delay,
              stagger: isProblem ? Math.min(stagger, 0.07) : stagger,
              ease: EASE_OUT,
              scrollTrigger: {
                trigger: list,
                start: LANDING_REVEAL_TRIGGERS.list,
                toggleActions: "play none none reverse",
              },
            },
          );
        });

        const howItWorks = document.getElementById("how-it-works");

        if (howItWorks) {
          const heading = howItWorks.querySelector("[data-motion-reveal]");
          const cards = howItWorks.querySelectorAll("[data-motion-item]");
          const background = howItWorks.querySelector("[data-how-bg]");

          gsap.fromTo(
            howItWorks,
            {
              autoAlpha: 0.6,
              y: isDesktop ? 84 : 52,
              scale: isDesktop ? 0.96 : 0.98,
            },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: howItWorks,
                start: LANDING_REVEAL_TRIGGERS.howItWorksStart,
                end: LANDING_REVEAL_TRIGGERS.howItWorksEnd,
                scrub: 0.45,
              },
            },
          );

          gsap
            .timeline({
              scrollTrigger: {
                trigger: howItWorks,
                start: LANDING_REVEAL_TRIGGERS.howItWorksTimeline,
                toggleActions: "play none none reverse",
              },
            })
            .fromTo(
              heading,
              { y: 64, autoAlpha: 0, scale: 0.96 },
              { y: 0, autoAlpha: 1, scale: 1, duration: 0.7, ease: EASE_OUT },
              0,
            )
            .fromTo(
              cards,
              {
                y: isDesktop ? 116 : 64,
                autoAlpha: 0,
                rotateX: isDesktop ? -18 : 0,
                scale: 0.9,
              },
              {
                y: 0,
                autoAlpha: 1,
                rotateX: 0,
                scale: 1,
                duration: 0.85,
                stagger: 0.12,
                ease: EASE_OUT,
              },
              0.12,
            );

          gsap.to(background, {
            scale: 1.08,
            yPercent: -5,
            ease: "none",
            scrollTrigger: {
              trigger: howItWorks,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          });
        }

        gsap.fromTo(
          "[data-reading-card]",
          { autoAlpha: 0, y: 120, rotateZ: -3, scale: 0.88 },
          {
            autoAlpha: 1,
            y: 0,
            rotateZ: 0,
            scale: 1,
            duration: 1,
            stagger: 0.16,
            ease: EASE_OUT,
            scrollTrigger: {
              trigger: "#reading-levels",
              start: LANDING_REVEAL_TRIGGERS.readingCards,
              toggleActions: "play none none reverse",
            },
          },
        );

        gsap.fromTo(
          "[data-miscue-card]",
          {
            autoAlpha: 0,
            y: 96,
            scale: 0.86,
            rotateZ: (i) => (i % 2 === 0 ? -5 : 5),
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotateZ: 0,
            duration: 0.9,
            stagger: {
              amount: 0.75,
              grid: "auto",
              from: "center",
            },
            ease: EASE_OUT,
            scrollTrigger: {
              trigger: "#miscues",
              start: LANDING_REVEAL_TRIGGERS.miscues,
              toggleActions: "play none none reverse",
            },
          },
        );

        gsap.to("[data-floating-visual]", {
          yPercent: (i) => (i % 2 === 0 ? -18 : 16),
          rotate: (i) => (i % 2 === 0 ? -3 : 3),
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.6,
          },
        });

        gsap.fromTo(
          "[data-testimonial-card]",
          { autoAlpha: 0, y: 90, scale: 0.9, rotateZ: 4 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotateZ: 0,
            duration: 1,
            stagger: 0.18,
            ease: EASE_OUT,
            scrollTrigger: {
              trigger: "#benefits",
              start: LANDING_REVEAL_TRIGGERS.testimonials,
              toggleActions: "play none none reverse",
            },
          },
        );

        gsap.fromTo(
          "[data-cta-panel]",
          {
            autoAlpha: 0,
            y: 120,
            scale: 0.9,
            borderRadius: "64px",
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            borderRadius: "40px",
            duration: 1.1,
            ease: EASE_OUT,
            scrollTrigger: {
              trigger: "#cta",
              start: LANDING_REVEAL_TRIGGERS.cta,
              toggleActions: "play none none reverse",
            },
          },
        );

        ScrollTrigger.refresh();
      },
    );

    return () => matchMedia.revert();
  }, []);

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[70] h-1 w-full overflow-hidden"
      aria-hidden="true"
    >
      <div
        ref={progressRef}
        className="h-full origin-left scale-x-0 bg-gradient-to-r from-[#6C4EEB] via-[#FF5DA2] to-[#1766D6]"
      />
    </div>
  );
}
