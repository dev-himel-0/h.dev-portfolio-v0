"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { markSoftNavigation } from "@/lib/navigation";
import {
  completeWipe,
  isWipeReady,
  wipeCoverDeferred,
  wipeReveal,
} from "@/lib/wipe";

/**
 * Route transition choreography for the shared curtain wipe. The invariant:
 * the incoming page must never paint over an uncovered viewport — it only
 * appears while the curtain is already up, and is revealed by the wipe.
 *
 * - Forward navigations (link clicks) are covered by `WipeCurtain`'s
 *   interceptor: panels animate in from bottom (yPercent 101 → 0) to cover
 *   the current viewport, `router.push` runs under full cover, and the
 *   reveal lifts the curtain once the incoming route commits.
 * - Back/forward navigation (`popstate`) cannot be intercepted in advance,
 *   but `popstate` fires before Next commits the route: the cover goes up
 *   right there, and the reveal waits for the commit below.
 * - Entrance: a page loaded directly (typed URL, refresh) on any route
 *   except home starts covered (yPercent 0) and immediately reveals
 *   (yPercent 0 → -101), so the page is never visible before the
 *   transition animation. Home keeps its preloader as the entrance instead.
 *
 * Soft navigation is detected during render via the "adjust state during
 * render" pattern: the layout renders before its children on every commit, so
 * by the time the incoming page's components render, `isSoftNavigation()`
 * already reports true — home can skip its preloader for the wipe. Hard
 * loads never mark it, so the preloader still plays on first visit. Wipes are
 * skipped (instant) under `prefers-reduced-motion`.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [previousPathname, setPreviousPathname] = useState(pathname);
  const lastPathnameRef = useRef(pathname);
  const mountPathRef = useRef(pathname);

  // Detect soft navigation during render, before the incoming page renders.
  if (pathname !== previousPathname) {
    setPreviousPathname(pathname);
    markSoftNavigation();
  }

  // Back/forward only — `popstate` never fires for router.push or Link. Some
  // browsers also emit it for hash-only navigation, so ignore events where
  // the pathname is unchanged; menu anchors should close and scroll directly.
  // The cover goes up the moment a route-changing `popstate` fires, i.e.
  // BEFORE the incoming route commits, so every paint of the new page happens
  // underneath it.
  // `completeWipe` below lifts the curtain once the commit has landed.
  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname === lastPathnameRef.current) return;
      wipeCoverDeferred(() => {});
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // The route has committed and painted under the curtain — lift it.
  // Covers both the popstate wipe above and link-click wipes from
  // `WipeCurtain`; a no-op when no wipe is pending (e.g. reduced motion).
  useEffect(() => {
    if (pathname === lastPathnameRef.current) return;
    lastPathnameRef.current = pathname;
    completeWipe();
  }, [pathname]);

  /**
   * Entrance wipe for directly-loaded pages: any hard load on a route other
   * than home (typed URL, refresh — e.g. the 404 page or future case-study
   * routes) starts the curtain covered (yPercent 0) and reveals it
   * (yPercent 0 → -101) so the page is never visible before the animation.
   * Home keeps the preloader, so it is skipped there. The effect deliberately
   * runs once per mount (empty deps): soft navigations reuse the interceptor
   * or the popstate wipe, never this path.
   */
  useEffect(() => {
    if (mountPathRef.current === "/") return;

    let cancelled = false;
    // Wait for the wipe overlay (mounted by `WipeCurtain`, a sibling) to
    // register before animating; cap the wait so a missing overlay degrades
    // to an instant reveal instead of spinning forever.
    const play = (frame: number) => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        if (!isWipeReady() && frame < 240) {
          play(frame + 1);
          return;
        }
        wipeReveal();
      });
    };
    play(0);

    return () => {
      cancelled = true;
    };
  }, []);

  return <div className="min-h-full">{children}</div>;
}
