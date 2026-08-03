"use client";

import { useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface PageTransitionProps {
  /** Unique key of the current route; a change triggers the wipe. */
  routeKey: string;
  /** The current route's content — swapped underneath the cover layer. */
  children: ReactNode;
  /** Total cover + reveal duration in ms (keep between 400–600). */
  duration?: number;
  /**
   * Fired as the cover lifts, letting the incoming page run its masked
   * editorial entrance (mirrors the preloader → hero `isRevealed` handoff).
   */
  onEnter?: () => void;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Route transition layer for future multi-page navigation. On `routeKey`
 * change, a near-black panel wipes up over the outgoing page, the incoming
 * `children` mounts underneath, then the panel wipes up and away while
 * `onEnter` starts the incoming page's masked entrance. Skipped (instant)
 * under `prefers-reduced-motion`. Not mounted anywhere yet — wire it into
 * the root layout once real routes exist.
 */
export function PageTransition({
  routeKey,
  children,
  duration = 460,
  onEnter,
}: PageTransitionProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const committedRouteRef = useRef(routeKey);
  const [content, setContent] = useState<{ route: string; node: ReactNode }>({
    route: routeKey,
    node: children,
  });

  useGSAP(
    () => {
      const layer = layerRef.current;
      if (layer) gsap.set(layer, { yPercent: 100 });

      if (routeKey === committedRouteRef.current) return;
      if (!layer || prefersReducedMotion()) {
        committedRouteRef.current = routeKey;
        setContent({ route: routeKey, node: children });
        return;
      }

      const half = duration / 2 / 1000;
      const timeline = gsap.timeline();
      timeline
        .to(layer, { yPercent: 0, duration: half, ease: "power3.in" })
        .add(() => {
          committedRouteRef.current = routeKey;
          setContent({ route: routeKey, node: children });
        })
        .to(layer, {
          yPercent: -100,
          duration: half,
          ease: "power4.inOut",
          onStart: onEnter,
        });

      return () => timeline.kill();
    },
    { dependencies: [routeKey, children, duration, onEnter] }
  );

  return (
    <div className="min-h-full">
      <div aria-hidden="true">{content.route === routeKey ? children : content.node}</div>
      <div
        ref={layerRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[90] bg-black will-change-transform"
      />
    </div>
  );
}