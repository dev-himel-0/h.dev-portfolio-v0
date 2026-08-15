"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

gsap.registerPlugin(ScrollTrigger);

const LENIS_OPTIONS = {
  duration: 1.3,
  easing: (t: number) => 1 - Math.pow(1 - t, 3),
  orientation: "vertical" as const,
  gestureOrientation: "vertical" as const,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
  autoRaf: false,
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
    const canUseSmoothScroll = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    ).matches;

    // Native touch scrolling is already compositor-driven. Running Lenis and
    // a second RAF loop on phones makes scrolling compete with the browser.
    if (!canUseSmoothScroll) return;

    const instance = new Lenis(LENIS_OPTIONS);
    const publishId = window.requestAnimationFrame(() => setLenis(instance));

    const update = (time: number) => instance.raf(time * 1000);

    instance.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

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
      instance.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(update);
      instance.destroy();
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}
