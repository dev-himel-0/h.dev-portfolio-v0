"use client";

import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type Ref,
} from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

/** Each wheel is a vertical tape of digits 0-9 repeated 12 times: 120 tiles,
 *  enough headroom for every roll in a 3-digit 0-100 meter (the unit wheel
 *  travels at most ~100 tiles). */
const TAPE_COPIES = 12;
const ROLL_DURATION = 0.3;
const ROLL_EASE = "power3.inOut";

export interface OdometerHandle {
  /** Roll the wheels toward `value` (0-100 for a 3-digit meter). */
  set: (value: number) => void;
}

export interface OdometerProps {
  ref?: Ref<OdometerHandle>;
  /** Number of digit wheels. Defaults to 3 (000-100). */
  digits?: number;
  className?: string;
}

/**
 * Mechanical-style odometer: black chip, hairline-divided digit wheels that
 * roll strictly upward (a 9-to-0 roll wraps through the repeated tape, so the
 * direction never flips). Driven imperatively via `set()`; each call animates
 * every wheel with GSAP (`overwrite: "auto"` so rapid updates keep the roll
 * continuous). Pure display, `aria-hidden`.
 */
export function Odometer({ ref, digits = 3, className }: OdometerProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const tapeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const indexRefs = useRef<number[]>(Array.from({ length: digits }, () => 0));
  const stepRef = useRef(0);
  const quickToRefs = useRef<Array<((value: number) => void) | null>>([]);

  const tape = useMemo(
    () => Array.from({ length: TAPE_COPIES * 10 }, (_, i) => String(i % 10)),
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      set: (value: number) => {
        const max = Math.pow(10, digits) - 1;
        const v = Math.max(0, Math.min(max, Math.round(value)));

        if (stepRef.current === 0) {
          const cell = rootRef.current?.querySelector<HTMLElement>(
            "[data-odometer-cell]",
          );
          if (cell) stepRef.current = cell.offsetHeight;
        }
        if (stepRef.current === 0) return;

        for (let p = 0; p < digits; p++) {
          const power = Math.pow(10, digits - 1 - p);
          const digit = Math.floor(v / power) % 10;
          const prev = indexRefs.current[p];
          const prevDigit = prev % 10;
          const tapeEl = tapeRefs.current[p];

          let target = prev;
          if (digit > prevDigit) target = prev + (digit - prevDigit);
          else if (digit < prevDigit) target = prev + (10 - prevDigit + digit);

          indexRefs.current[p] = target;
          if (!tapeEl || target === prev) continue;

          quickToRefs.current[p] ??= gsap.quickTo(tapeEl, "y", {
            duration: ROLL_DURATION,
            ease: ROLL_EASE,
          });
          quickToRefs.current[p]?.(-target * stepRef.current);
        }
      },
    }),
    [digits],
  );

  useEffect(() => {
    const tapeElements = tapeRefs.current;
    return () => {
      tapeElements.forEach((tapeEl) => {
        if (tapeEl) gsap.killTweensOf(tapeEl);
      });
    };
  }, []);

  return (
    <span
      ref={rootRef}
      data-odometer
      aria-hidden="true"
      className={cn(
        "flex items-center bg-black px-3 py-1 font-mono text-sm leading-none font-light text-white/80 tabular-nums",
        className,
      )}
    >
      <span className="flex items-stretch">
        {Array.from({ length: digits }).map((_, p) => (
          <span
            key={p}
            data-odometer-wheel
            className={cn(
              "relative block h-[1em] w-[0.62em] overflow-hidden text-center",
              p < digits - 1 && "mr-[0.18em] border-r border-white/10",
            )}
          >
            <span
              ref={(el) => {
                tapeRefs.current[p] = el;
              }}
              data-odometer-tape
              className="absolute inset-x-0 top-0 flex flex-col will-change-transform"
            >
              {tape.map((d, i) => (
                <span
                  key={i}
                  data-odometer-cell
                  className="flex h-[1em] items-center justify-center"
                >
                  {d}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
      <span className="ml-[0.3em]">%</span>
    </span>
  );
}
