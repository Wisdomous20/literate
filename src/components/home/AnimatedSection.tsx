"use client";

import { Children, type ReactNode } from "react";

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
  return (
    <div
      className={className}
      data-motion-reveal=""
      data-motion-direction={direction}
      data-motion-delay={delay}
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
  const childArray = Children.toArray(children);

  return (
    <div
      className={className}
      data-motion-list=""
      data-motion-stagger={staggerDelay}
      data-motion-delay={baseDelay}
    >
      {childArray.map((child, i) => (
        <div
          key={i}
          data-motion-item=""
        >
          {child}
        </div>
      ))}
    </div>
  );
}
