"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { Odometer, type OdometerHandle } from "@/components/ui/odometer";

gsap.registerPlugin(useGSAP);

interface CurtainRevealProps {
  /** When true, children fade out then the panels wipe away and onComplete fires. Ignored when `progress` is set. */
  play?: boolean;
  /** Number of vertical panels. */
  panels?: number;
  /** Duration of the panel wipe. */
  duration?: number;
  /** Stagger between panels. */
  stagger?: number;
  /** Duration of the children fade-out. */
  fadeDuration?: number;
  /**
   * When set, the curtain drives itself: a progress line under the content
   * fills over `progress` ms with a 0-100% odometer, then the content fades
   * out and the panels wipe away.
   */
  progress?: number;
  /** Content shown on top of the panels (e.g. the loader words). */
  children?: ReactNode;
  /** Fires when the panel wipe starts (or immediately under reduced motion). */
  onReveal?: () => void;
  onComplete?: () => void;
  className?: string;
}

/**
 * Full-screen curtain of black vertical bands that also hosts content on top
 * (the loader words). Two modes:
 * - `play`: children fade out, then the bands wipe upward with a stagger.
 * - `progress`: a single hairline fills left-to-right across a bare black
 *   field (no track) with a centered odometer on a black chip that masks the
 *   line as it passes — an expo glide with an overshoot snap and
 *   a light breath before children fade and the bands wipe (the line is the
 *   timer).
 * Always uses the full curtain choreography.
 */
export function CurtainReveal({
  play = false,
  panels = 5,
  duration = 1,
  stagger = 0.08,
  fadeDuration = 0.4,
  progress,
  children,
  onReveal,
  onComplete,
  className,
}: CurtainRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const odometerRef = useRef<OdometerHandle>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        onReveal?.();
        onComplete?.();
        return;
      }

      const bandEls = Array.from(
        root.querySelectorAll<HTMLElement>("[data-curtain-panel]"),
      );
      const content = root.querySelector<HTMLElement>("[data-curtain-content]");

      const startWipe = () => {
        onReveal?.();
        const tl = gsap.timeline();
        if (content) {
          tl.to(
            content,
            { autoAlpha: 0, duration: fadeDuration, ease: "power2.in" },
            0,
          );
        }
        tl.to(
          bandEls,
          {
            yPercent: -101,
            duration,
            ease: "power4.inOut",
            stagger,
          },
          content ? fadeDuration + 0.1 : 0,
        );
        if (onComplete) tl.add(onComplete);
      };

      if (progress !== undefined) {
        const fill = root.querySelector<HTMLElement>(
          "[data-curtain-progress-fill]",
        );
        const odometer = root.querySelector<HTMLElement>("[data-odometer]");

        if (fill) {
          const state = { v: 0 };
          const total = progress / 1000;
          const settle = 0.42;
          const main = total - settle;
          const seg = main / 3;
          const setFillProgress = gsap.quickSetter(fill, "scaleX");

          const write = () => {
            setFillProgress(state.v);
            odometerRef.current?.set(Math.round(state.v * 100));
          };

          const tl = gsap.timeline();
          tl.fromTo(
            odometer,
            { autoAlpha: 0, y: 6 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
            0.15,
          )
            .to(state, {
              v: 1 / 3,
              duration: seg,
              ease: "power2.inOut",
              onUpdate: write,
            })
            .to(state, {
              v: 2 / 3,
              duration: seg,
              ease: "power2.inOut",
              onUpdate: write,
            })
            .to(state, {
              v: 1,
              duration: seg,
              ease: "power2.inOut",
              onUpdate: write,
            })
            .to(
              fill,
              { scaleX: 1.015, duration: 0.12, ease: "power2.out" },
              ">-0.05",
            )
            .to(fill, { scaleX: 1, duration: 0.3, ease: "power2.inOut" })
            .to(
              fill,
              { opacity: 0.55, duration: 0.15, ease: "power2.in" },
              ">-0.1",
            )
            .to(
              fill,
              { opacity: 1, duration: 0.15, ease: "power2.out" },
              ">-0.05",
            )
            .add(startWipe, ">");
          return;
        }
        startWipe();
        return;
      }

      if (play) startWipe();
    },
    { dependencies: [play, progress] },
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 z-50 flex", className)}
    >
      {Array.from({ length: panels }).map((_, i) => (
        <div
          key={i}
          data-curtain-panel
          className="-ml-px h-full min-w-0 flex-1 bg-black will-change-transform first:ml-0"
        />
      ))}
      {(children || progress !== undefined) && (
        <div
          data-curtain-content
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex w-fit flex-col items-center">
            {children}
            {progress !== undefined && (
              <div className="relative mt-8 w-[clamp(12rem,26vw,22rem)]">
                <div className="h-px overflow-hidden">
                  <div
                    data-curtain-progress-fill
                    className="h-px w-full origin-left scale-x-0 bg-white will-change-transform"
                  />
                </div>
                <Odometer
                  ref={odometerRef}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
