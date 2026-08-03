"use client";

import { ReactLenis } from "lenis/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import type { ComponentRef } from "react";

/**
 * Global smooth-scroll provider (Lenis), synced with the GSAP ticker.
 * Disabled entirely when the user prefers reduced motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<ComponentRef<typeof ReactLenis>>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(update);
      gsap.ticker.lagSmoothing(500);
    };
  }, [reduced]);

  if (reduced) return <>{children}</>;

  return (
    <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
      {children}
    </ReactLenis>
  );
}
