"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface PinnedSectionProps {
  children: ReactNode;
  className?: string;
  /** Extra scroll distance the section stays pinned, e.g. "+=100%". */
  end?: string;
}

/**
 * Sticky scroll container: the viewport pins to the top while the page
 * scrolls through `end` of extra distance. Inner content stays in view,
 * so reveals/scrubs inside keep working. Skipped under `prefers-reduced-motion`.
 */
export function PinnedSection({
  children,
  className,
  end = "+=100%",
}: PinnedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scope = ref.current;
      if (!scope) {
        return;
      }

      ScrollTrigger.create({
        trigger: scope,
        start: "top top",
        end,
        pin: viewportRef.current,
        anticipatePin: 1,
      });
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className={cn(className)}
    >
      <div
        ref={viewportRef}
        className="flex h-screen items-center justify-center"
      >
        {children}
      </div>
    </div>
  );
}
