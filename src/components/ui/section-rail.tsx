"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { useSmoothScroll } from "@/components/ui/smooth-scroll";

const RAIL_CLAMP = "clamp(2.25rem,2.65vw,2.75rem)";

/**
 * Default section rail: a dot + thin line + vertical index pinned at
 * mid-viewport on an alternating side (hero left, work right, services
 * left, ...). Appears when the section content reaches mid-viewport and
 * fades up while sliding up as the next section becomes visible. The
 * track is shortened so the sticky pin releases exactly when the next
 * section starts showing. Skipped on touch sizes and under
 * `prefers-reduced-motion` (instant state changes).
 */
interface SectionRailProps {
  sectionRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLElement | null>;
  index: string;
  side: "left" | "right";
}

export function SectionRail({
  sectionRef,
  contentRef,
  index,
  side,
}: SectionRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const lenis = useSmoothScroll();

  useEffect(() => {
    const rail = railRef.current;
    const content = contentRef.current;
    const section = sectionRef.current;
    if (!rail || !content || !section) return;

    let visible = false;
    let contentTopAbs = 0;
    let sectionBottomAbs = 0;

    gsap.set(rail, { yPercent: -50, y: 0 });

    const measure = () => {
      contentTopAbs = content.getBoundingClientRect().top + window.scrollY;
      sectionBottomAbs =
        section.getBoundingClientRect().bottom + window.scrollY;
    };
    measure();

    const show = () => {
      gsap.to(rail, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const hide = () => {
      gsap.to(rail, {
        opacity: 0,
        y: -96,
        duration: 1.4,
        ease: "power3.inOut",
        overwrite: "auto",
      });
    };

    const apply = () => {
      const next =
        window.scrollY >= contentTopAbs - window.innerHeight / 2 &&
        window.scrollY < sectionBottomAbs - window.innerHeight - 4;
      if (next !== visible) {
        visible = next;
        if (next) {
          show();
        } else {
          hide();
        }
      }
    };

    const onResize = () => {
      measure();
      apply();
    };

    const onScroll = () => apply();
    if (lenis) {
      lenis.on("scroll", onScroll);
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("resize", onResize);
    void document.fonts?.ready?.then(onResize);
    apply();

    return () => {
      if (lenis) {
        lenis.off("scroll", onScroll);
      } else {
        window.removeEventListener("scroll", onScroll);
      }
      window.removeEventListener("resize", onResize);
    };
  }, [contentRef, sectionRef, lenis]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 hidden lg:flex"
      style={{
        height: "calc(100% - 50vh + 7rem)",
        ...(side === "left" ? { left: RAIL_CLAMP } : { right: RAIL_CLAMP }),
      }}
    >
      <div
        ref={railRef}
        data-rail
        className="sticky top-[50vh] self-start opacity-0"
      >
        <div className="overflow-hidden">
          <div className="flex flex-col items-center gap-4">
            <span className="size-1.5 bg-black" />
            <span className="h-14 w-px origin-top bg-black/50" />
            <span
              data-rail-label
              className="text-[0.625rem] font-medium tracking-[0.22em] text-black/60 uppercase [writing-mode:vertical-rl]"
            >
              {index}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
