"use client";

import Lenis from "lenis";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const LENIS_OPTIONS = {
  duration: 1.6,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: "vertical" as const,
  gestureOrientation: "vertical" as const,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
};

const LenisContext = createContext<Lenis | null>(null);

export function useSmoothScroll() {
  return useContext(LenisContext);
}

/**
 * Global smooth-scroll provider matching the ReactBits portfolio template.
 * Lenis owns interpolation while the browser retains the native document
 * scroll container.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis(LENIS_OPTIONS);
    const publishId = window.requestAnimationFrame(() => setLenis(instance));

    function raf(time: number) {
      instance.raf(time);
      rafId = window.requestAnimationFrame(raf);
    }

    let rafId = window.requestAnimationFrame(raf);

    function handleAnchorClick(event: MouseEvent) {
      if (event.defaultPrevented) return;

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const element = document.querySelector(href);
      if (!(element instanceof HTMLElement)) return;

      event.preventDefault();
      window.history.pushState(null, "", href);
      instance.scrollTo(element, { offset: -100 });
    }

    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      window.cancelAnimationFrame(publishId);
      window.cancelAnimationFrame(rafId);
      instance.destroy();
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
