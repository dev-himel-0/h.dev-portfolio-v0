"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { cn, prefersReducedMotion } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger, useGSAP)

const DIGIT_TAPE = Array.from({ length: 10 }, (_, value) => value)

interface RollingNumberProps {
  /** Full value string: a numeric core plus optional static parts,
   *  e.g. "35%", "+28%", "1.4×", "01". */
  value: string
  /** Static text appended after the parsed suffix (about's "+"). */
  suffix?: string
  /** Classes for the static suffix (about renders it small). */
  suffixClassName?: string
  /** Emits `data-{marker}` on the root element (test/query hook). */
  marker?: string
  className?: string
  /** Delay before the wheels start rolling (stagger between stats). */
  delay?: number
  /** Roll duration per strip. Defaults to 1.8. */
  duration?: number
  /** Decorative mode: no accessible copy, root marked aria-hidden. */
  ariaHidden?: boolean
}

/**
 * Mechanical rolling number: each digit of the numeric core is a vertical
 * 0-9 tape clipped to one digit column; static prefix/suffix characters sit
 * beside the wheels. The markup renders the final digits (SSR-safe), then
 * GSAP rewinds and rolls them once the element crosses mid-viewport.
 * Skipped under `prefers-reduced-motion` — final state is already in markup.
 */
export function RollingNumber({
  value,
  suffix = "",
  suffixClassName,
  marker,
  className,
  delay = 0,
  duration = 1.8,
  ariaHidden = false,
}: RollingNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)

  const parts = value.match(/^([^\d]*)([\d.]+)(.*)$/)
  const prefix = parts?.[1] ?? ""
  const core = parts?.[2] ?? ""
  const tail = parts?.[3] ?? ""

  useGSAP(
    () => {
      const root = ref.current
      if (!root || prefersReducedMotion()) return

      const strips = root.querySelectorAll<HTMLElement>("[data-odometer-strip]")
      if (!strips.length) return

      const st = ScrollTrigger.create({
        trigger: root,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.set(strips, { yPercent: 0, y: 0, willChange: "transform" })
          gsap.to(strips, {
            yPercent: (index: number) => {
              const digit = Number(strips[index].dataset.digit ?? 0)
              return -(digit * 10)
            },
            y: 0,
            duration,
            ease: "expo.out",
            delay,
            onComplete: () => gsap.set(strips, { clearProps: "willChange" }),
          })
        },
      })

      return () => st.kill()
    },
    { scope: ref },
  )

  return (
    <span
      ref={ref}
      data-rolling-number
      data-value={value}
      {...(marker ? { [`data-${marker}`]: "" } : {})}
      aria-hidden={ariaHidden || undefined}
      className={cn("flex items-baseline tabular-nums", className)}
    >
      {!ariaHidden && (
        <span className="sr-only">
          {value}
          {suffix}
        </span>
      )}
      <span aria-hidden="true" className="flex items-baseline">
        {prefix && <span className="mr-[0.04em]">{prefix}</span>}
        {core.split("").map((char, index) =>
          char === "." ? (
            <span key={`${char}-${index}`} className="mr-[0.04em]">
              {char}
            </span>
          ) : (
            <RollingDigit
              key={`${char}-${index}`}
              digit={char}
              className={cn(index < core.length - 1 && "mr-[0.04em]")}
            />
          ),
        )}
        {tail && <span className="ml-[0.08em]">{tail}</span>}
        {suffix && <span className={cn("ml-[0.08em]", suffixClassName)}>{suffix}</span>}
      </span>
    </span>
  )
}

/**
 * One odometer column: a vertical 0-9 strip clipped to a single digit.
 * The inline transform holds the final digit; GSAP rewinds to 0 and rolls.
 */
function RollingDigit({ digit, className }: { digit: string; className?: string }) {
  const target = Number(digit) * 10

  return (
    <span className={cn("relative inline-block h-[1em] overflow-hidden", className)}>
      <span
        aria-hidden="true"
        data-odometer-strip
        data-digit={digit}
        className="flex flex-col will-change-transform"
        style={{ transform: `translateY(-${target}%)` }}
      >
        {DIGIT_TAPE.map((value) => (
          <span key={value} className="flex h-[1em] items-center justify-center leading-none">
            {value}
          </span>
        ))}
      </span>
    </span>
  )
}
