"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

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
   * fills over `progress` ms with a 0-100% counter, then the content fades
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
 * - `progress`: a hairline the width of the content fills over `progress` ms
 *   with a synced 0-100% counter beneath it — when it completes, children
 *   fade and the bands wipe (the line is the timer).
 * Under `prefers-reduced-motion` it completes instantly without animating.
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
  const countRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const bandEls = Array.from(root.querySelectorAll<HTMLElement>("[data-curtain-panel]"));
      const content = root.querySelector<HTMLElement>("[data-curtain-content]");

      const startWipe = () => {
        onReveal?.();
        const tl = gsap.timeline();
        if (content) {
          tl.to(content, { autoAlpha: 0, duration: fadeDuration, ease: "power2.in" }, 0);
        }
        tl.to(
          bandEls,
          {
            yPercent: -101,
            duration,
            ease: "power4.inOut",
            stagger,
          },
          content ? fadeDuration + 0.1 : 0
        );
        if (onComplete) tl.add(onComplete);
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        onReveal?.();
        onComplete?.();
        return;
      }

      if (progress !== undefined) {
        const fills = Array.from(root.querySelectorAll<HTMLElement>("[data-curtain-progress-fill]"));
        const count = countRef.current;

        if (fills.length) {
          const tween = gsap.fromTo(
            fills,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: progress / 1000,
              ease: "none",
              onComplete: startWipe,
            }
          );
          if (count) {
            const counter = { value: 0 };
            tween.progress(0);
            gsap.to(counter, {
              value: 100,
              duration: progress / 1000,
              ease: "none",
              onUpdate: () => {
                count.textContent = `${Math.round(counter.value)}%`;
              },
            });
          }
        } else {
          startWipe();
        }
        return;
      }

      if (play) startWipe();
    },
    { dependencies: [play, progress] }
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
          className="h-full flex-1 bg-black will-change-transform"
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
              <div className="mt-8 flex w-1/2 items-center gap-3">
                <div className="h-px flex-1 overflow-hidden bg-white/15">
                  <div
                    data-curtain-progress-fill
                    className="h-full w-full origin-right scale-x-0 bg-white will-change-transform"
                  />
                </div>
                <span
                  ref={countRef}
                  className="font-mono text-xs tabular-nums text-white/70"
                >
                  0%
                </span>
                <div className="h-px flex-1 overflow-hidden bg-white/15">
                  <div
                    data-curtain-progress-fill
                    className="h-full w-full origin-left scale-x-0 bg-white will-change-transform"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
