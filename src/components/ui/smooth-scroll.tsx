"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import type { ComponentRef } from "react";

/**
 * Satz-compatible global smooth-scroll provider. Satz uses Lenis 1.1.9 with
 * a 1.4-second duration and a standalone requestAnimationFrame loop.
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

    let rafId = 0;
    let pausedForVisibility = false;

    const loop = (time: number) => {
      lenisRef.current?.lenis?.raf(time);
      rafId = window.requestAnimationFrame(loop);
    };

    const onVisibilityChange = () => {
      const lenis = lenisRef.current?.lenis;
      if (!lenis) return;

      if (document.visibilityState === "hidden") {
        pausedForVisibility = true;
        window.cancelAnimationFrame(rafId);
      } else if (pausedForVisibility) {
        pausedForVisibility = false;
        // Reset Lenis' clock so a background-tab gap does not jump the scroll.
        lenis.time = performance.now();
        rafId = window.requestAnimationFrame(loop);
      }
    };

    rafId = window.requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reduced]);

  if (reduced) return <>{children}</>;

  return (
    <ReactLenis
      root
      autoRaf={false}
      options={{
        duration: 1.4,
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1,
        wheelMultiplier: 1,
      }}
      ref={lenisRef}
    >
      {children}
    </ReactLenis>
  );
}
