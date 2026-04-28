"use client";

import { useEffect, useRef, Children, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "fade";
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
  direction = "up",
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const x = direction === "left" ? -40 : direction === "right" ? 40 : 0;
    const y = direction === "up" ? 40 : 0;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        element,
        { opacity: 0, x, y },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.7,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 82%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );
    }, element);

    return () => ctx.revert();
  }, [delay, direction]);

  return (
    <div
      ref={ref}
      className={className}
    >
      {children}
    </div>
  );
}

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  baseDelay?: number;
}

export function AnimatedList({
  children,
  className,
  staggerDelay = 0.1,
  baseDelay = 0,
}: AnimatedListProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const childArray = Children.toArray(children);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const items = Array.from(element.children);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          delay: baseDelay,
          stagger: staggerDelay,
          scrollTrigger: {
            trigger: element,
            start: "top 82%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );
    }, element);

    return () => ctx.revert();
  }, [baseDelay, staggerDelay]);

  return (
    <div ref={ref} className={className}>
      {childArray.map((child, i) => (
        <div key={i}>
          {child}
        </div>
      ))}
    </div>
  );
}
