"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface StaggerTextProps {
  /** Plain text; split and animated by word or by letter. */
  children: string;
  divideBy?: "word" | "letter";
  /** Delay before the first unit starts moving, in seconds. */
  delay?: number;
  /** Root element: block for a statement line, span for inline labels. */
  as?: "p" | "span";
  className?: string;
}

/**
 * Vengence UI "Stagger Text" adapted to GSAP: each word (or letter) sits in
 * an overflow-hidden mask and slides up from 110% on scroll entry, staggered
 * with an expo ease. Once-only ScrollTrigger; skipped entirely under
 * `prefers-reduced-motion` so the text is always readable.
 */
export function StaggerText({
  children,
  divideBy = "word",
  delay = 0,
  as = "p",
  className,
}: StaggerTextProps) {
  const ref = useRef<HTMLElement | null>(null);

  const parts = useMemo(() => {
    if (divideBy === "letter") {
      return children.split("").map((char) => (char === " " ? "\u00A0" : char));
    }
    return children.split(" ").map((word) => `${word}\u00A0`);
  }, [children, divideBy]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) {
        return;
      }

      const units = el.querySelectorAll<HTMLElement>("[data-stagger-unit]");
      if (!units.length) return;

      gsap.fromTo(
        units,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 0.8,
          ease: "power4.out",
          stagger: divideBy === "word" ? 0.05 : 0.02,
          delay,
          onStart: () => gsap.set(units, { willChange: "transform" }),
          onComplete: () => gsap.set(units, { clearProps: "willChange" }),
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            onEnter: (self) =>
              requestAnimationFrame(() => self.kill(false, true)),
          },
        },
      );
    },
    { scope: ref },
  );

  const content = parts.map((part, index) => (
    <span
      key={`${part}-${index}`}
      className="relative inline-block overflow-hidden align-top"
    >
      <span
        data-stagger-unit
        className="inline-block"
      >
        {part}
      </span>
    </span>
  ));

  const classes = cn(as === "span" && "inline-block", className);

  if (as === "p") {
    return (
      <p
        ref={ref as React.Ref<HTMLParagraphElement>}
        data-stagger-text
        className={classes}
      >
        {content}
      </p>
    );
  }

  return (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      data-stagger-text
      className={classes}
    >
      {content}
    </span>
  );
}
