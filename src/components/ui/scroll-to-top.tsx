"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { scrollToInstant, wipeCover } from "@/lib/wipe";
import { useSmoothScroll } from "@/components/ui/smooth-scroll";

const RING_RADIUS = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SHOW_THRESHOLD = 0.2;

/**
 * Floating circular scroll-to-top button with an SVG progress ring. The
 * button appears after scrolling past 20% of the page; clicking it plays the
 * shared curtain wipe (see `WipeCurtain` / `src/lib/wipe.ts`), scrolls to the
 * hero while the viewport is covered, then wipes away to reveal the page.
 * Hidden when the staggered menu is open and inactive at the top of the page.
 */
export function ScrollToTop() {
  const [shouldShow, setShouldShow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollFrameRef = useRef<number | null>(null);
  const progressRingRef = useRef<SVGCircleElement>(null);
  const shouldShowRef = useRef(false);
  const lenis = useSmoothScroll();

  // Coalesce Lenis' frequent scroll events into one DOM update per frame. The
  // ring does not need a React render while the page is gliding.
  useEffect(() => {
    const update = () => {
      scrollFrameRef.current = null;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      let nextProgress = 0;
      if (maxScroll <= 0) {
        nextProgress = 0;
      } else {
        nextProgress = Math.min(window.scrollY / maxScroll, 1);
      }

      progressRingRef.current?.setAttribute(
        "stroke-dashoffset",
        String(RING_CIRCUMFERENCE * (1 - nextProgress)),
      );
    };

    const onScroll = () => {
      // This threshold controls interactivity, so update it synchronously even
      // when reduced-motion browsers defer animation frames.
      const nextShouldShow =
        window.scrollY > window.innerHeight * SHOW_THRESHOLD;
      if (nextShouldShow !== shouldShowRef.current) {
        shouldShowRef.current = nextShouldShow;
        setShouldShow(nextShouldShow);
      }
      if (scrollFrameRef.current === null) {
        scrollFrameRef.current = window.requestAnimationFrame(update);
      }
    };

    if (lenis) {
      lenis.on("scroll", onScroll);
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      if (lenis) {
        lenis.off("scroll", onScroll);
      } else {
        window.removeEventListener("scroll", onScroll);
      }
      window.removeEventListener("resize", onScroll);
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, [lenis]);

  // ── Detect staggered menu open (DOM observation) ──────────────────
  useEffect(() => {
    const check = () => {
      const smg = document.querySelector<HTMLElement>(".smg");
      setMenuOpen(smg?.hasAttribute("data-open") ?? false);
    };

    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-open"],
    });

    return () => observer.disconnect();
  }, []);

  const visible = shouldShow && !menuOpen;

  // ── Detect preloader active ───────────────────────────────────────
  // ── Scroll to top through the shared curtain wipe ──────────────────
  const handleClick = useCallback(() => {
    wipeCover(() => {
      scrollToInstant(0);
    });
  }, []);

  const shouldHide = menuOpen;

  return (
    <>
      {/* Scroll-to-top button */}
      <button
        type="button"
        data-scroll-to-top
        aria-label="Scroll to top"
        onClick={handleClick}
        className="stt-button"
        data-visible={visible && !shouldHide ? "" : undefined}
      >
        <svg
          viewBox="0 0 48 48"
          className="stt-ring"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx="24"
            cy="24"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.15"
          />
          {/* Progress */}
          <circle
            ref={progressRingRef}
            cx="24"
            cy="24"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE}
            className="stt-progress"
          />
        </svg>
        <ArrowUp
          weight="bold"
          className="stt-arrow"
          aria-hidden="true"
        />
        <ArrowUp
          weight="bold"
          className="stt-arrow stt-arrow-ghost"
          aria-hidden="true"
        />
      </button>
    </>
  );
}
