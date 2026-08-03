"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  /** How content enters: fade-up, masked slide-up, or 3D tilt appear. */
  variant?: "fade" | "mask" | "tilt";
  /** Stagger delay between elements marked with [data-reveal]. */
  stagger?: number;
  /** ScrollTrigger start position. */
  start?: string;
}

/**
 * Reusable scroll-reveal wrapper. By default reveals itself; add `data-reveal`
 * to direct children to reveal them individually with a stagger.
 * Skipped entirely under `prefers-reduced-motion`.
 */
export function SectionReveal({
  children,
  className,
  variant = "fade",
  stagger = 0.08,
  start = "top 85%",
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scope = ref.current;
      if (!scope || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const marked = scope.querySelectorAll<HTMLElement>("[data-reveal]");
      const targets = marked.length ? Array.from(marked) : [scope];

      const from =
        variant === "mask"
          ? { yPercent: 110 }
          : variant === "tilt"
            ? { y: 60, rotateX: -6, opacity: 0 }
            : { y: 48, opacity: 0 };

      gsap.from(targets, {
        ...from,
        duration: 1,
        ease: "power3.out",
        stagger,
        scrollTrigger: {
          trigger: scope,
          start,
          once: true,
        },
      });
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      className={cn(
        variant === "mask" && "overflow-hidden",
        variant === "tilt" && "[perspective:1000px]",
        className
      )}
    >
      {children}
    </div>
  );
}
