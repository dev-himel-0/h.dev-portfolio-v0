"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import gsap from "gsap";
import { useLenis } from "lenis/react";
import { prefersReducedMotion } from "@/lib/utils";

const RING_RADIUS = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SHOW_THRESHOLD = 0.2;
const CURTAIN_PANELS = 5;

/**
 * Floating circular scroll-to-top button with an SVG progress ring and a
 * cinematic curtain-wipe reveal on click. The button appears after scrolling
 * past 20% of the page; clicking it wipes the viewport with black vertical
 * bands (bottom → top), scrolls to the hero, then wipes them away to reveal
 * the page. Hidden when the staggered menu is open or while the preloader
 * is active. Falls back to a plain smooth scroll under `prefers-reduced-motion`.
 */
export function ScrollToTop() {
  const [progress, setProgress] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const curtainRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement[]>([]);
  const busyRef = useRef(false);
  const lenis = useLenis();

  // ── Scroll progress tracking ──────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(window.scrollY / maxScroll, 1));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Visibility: show after 20% scroll, hide when menu is open ─────
  useEffect(() => {
    const threshold = window.innerHeight * SHOW_THRESHOLD;

    const update = () => {
      setShouldShow(window.scrollY > threshold);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

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
  const [preloaderActive, setPreloaderActive] = useState(true);

  useEffect(() => {
    const check = () => {
      const panels = document.querySelectorAll("[data-curtain-panel]");
      setPreloaderActive(panels.length > 0);
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // ── Curtain wipe animation ────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;

    if (prefersReducedMotion()) {
      window.scrollTo({ top: 0, behavior: "instant" });
      busyRef.current = false;
      return;
    }

    const curtain = curtainRef.current;
    const panels = panelsRef.current.filter(Boolean);
    if (!curtain || panels.length === 0) {
      window.scrollTo({ top: 0, behavior: "instant" });
      busyRef.current = false;
      return;
    }

    lenis?.stop();

    gsap.set(curtain, { display: "flex" });
    gsap.set(panels, { yPercent: 101, autoAlpha: 1 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(curtain, { display: "none" });
        lenis?.start();
        busyRef.current = false;
      },
    });

    // Phase 1: Wipe in from bottom
    tl.to(panels, {
      yPercent: 0,
      duration: 0.5,
      ease: "power4.out",
      stagger: 0.07,
    });

    // Phase 2: Scroll to top while covered
    tl.add(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    });

    // Phase 3: Brief hold
    tl.to({}, { duration: 0.15 });

    // Phase 4: Wipe out to top
    tl.to(panels, {
      yPercent: -101,
      duration: 0.8,
      ease: "power4.inOut",
      stagger: 0.08,
    });
  }, [lenis]);

  const shouldHide = menuOpen || preloaderActive;

  return (
    <>
      {/* Curtain overlay for the wipe animation */}
      <div
        ref={curtainRef}
        aria-hidden="true"
        className="stt-curtain"
        style={{ display: "none" }}
      >
        {Array.from({ length: CURTAIN_PANELS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) panelsRef.current[i] = el;
            }}
            className="stt-curtain-panel"
          />
        ))}
      </div>

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
            cx="24"
            cy="24"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
            className="stt-progress"
          />
        </svg>
        <ArrowUp weight="bold" className="stt-arrow" aria-hidden="true" />
      </button>
    </>
  );
}
