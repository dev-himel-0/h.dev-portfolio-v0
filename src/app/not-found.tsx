"use client"

import { useCallback, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight } from "@phosphor-icons/react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { FuzzyText } from "@/components/ui/fuzzy-text"
import { notFound, profile } from "@/lib/data"

gsap.registerPlugin(useGSAP)

const GLITCH_INTERVAL = 2600
const GLITCH_DURATION = 220

/**
 * Gap between the wipe curtain starting and the 404 entrance timeline. The
 * curtain (hold 0.15 + reveal 0.8 × power4.inOut) fully clears ~1.6s
 * after wipe-start. The timeline begins as the last bands leave, so every
 * beat below plays on an open screen.
 */
const ENTRANCE_DELAY_S = 1.65

const LINK_TEXT = "Back home"
const CHAR_HOVER_DURATION = 0.65
const CHAR_HOVER_STAGGER = 0.03

export default function NotFound() {
  const rootRef = useRef<HTMLElement>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)
  const pathname = usePathname()

  const wave = useCallback((on: boolean) => {
    const link = linkRef.current
    if (!link) return
    const rest = Array.from(link.querySelectorAll<HTMLElement>(".smg-char-a"))
    const clone = Array.from(link.querySelectorAll<HTMLElement>(".smg-char-b"))
    if (!rest.length || !clone.length) return

    gsap.to(rest, {
      yPercent: on ? -100 : 0,
      duration: CHAR_HOVER_DURATION,
      ease: "power4.inOut",
      stagger: { each: CHAR_HOVER_STAGGER },
      overwrite: "auto",
    })
    gsap.to(clone, {
      yPercent: on ? 0 : 100,
      duration: CHAR_HOVER_DURATION,
      ease: "power4.inOut",
      stagger: { each: CHAR_HOVER_STAGGER },
      overwrite: "auto",
    })
  }, [])

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const animatedEls = [
        "[data-nf-top]",
        "[data-nf-status]",
        "[data-nf-message]",
        "[data-nf-action]",
        "[data-nf-bottom]",
      ]
      gsap.set(animatedEls, { willChange: "transform,opacity" })

      const timeline = gsap.timeline({
        delay: ENTRANCE_DELAY_S,
        defaults: { ease: "power4.out" },
        onComplete: () => {
          gsap.set(animatedEls, { clearProps: "willChange" })
        },
      })

      timeline
        .from("[data-nf-top]", { y: -8, autoAlpha: 0, duration: 0.55 }, 0.1)
        .from(
          "[data-nf-status]",
          { yPercent: 110, autoAlpha: 0, duration: 1.2, ease: "expo.out" },
          0.3,
        )
        .from(
          "[data-nf-message]",
          { yPercent: 110, autoAlpha: 0, duration: 0.8, ease: "power4.out" },
          1.0,
        )
        .from("[data-nf-action]", { autoAlpha: 0, duration: 0.5, ease: "power2.out" }, 1.5)
        .from("[data-nf-bottom]", { autoAlpha: 0, duration: 0.5, ease: "power2.out" }, 1.7)
    },
    { scope: rootRef },
  )

  useGSAP(
    () => {
      const link = linkRef.current
      if (!link) return

      gsap.set(link.querySelectorAll(".smg-char-b"), { yPercent: 100 })

      const onEnter = () => wave(true)
      const onLeave = () => wave(false)
      link.addEventListener("pointerenter", onEnter)
      link.addEventListener("pointerleave", onLeave)

      return () => {
        link.removeEventListener("pointerenter", onEnter)
        link.removeEventListener("pointerleave", onLeave)
        link.querySelectorAll<HTMLElement>(".smg-char").forEach((el) => gsap.killTweensOf(el))
      }
    },
    { scope: linkRef },
  )

  return (
    <main ref={rootRef} className="relative flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 px-[clamp(1.5rem,6vw,4.5rem)] pt-[clamp(1.5rem,4vh,2.75rem)]">
        <p
          data-nf-top
          className="text-[0.625rem] leading-none font-semibold tracking-[0.22em] text-black/45 uppercase"
        >
          {profile.name} — {profile.role}
        </p>
        <p
          data-nf-top
          className="text-[0.625rem] leading-none font-semibold tracking-[0.22em] text-black/45 uppercase"
        >
          Error {notFound.status}
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-[clamp(2rem,6vh,3.5rem)] px-6 py-[clamp(2rem,6vh,4rem)] text-center">
        <h1 className="sr-only">
          {notFound.status} — {notFound.label}
        </h1>

        <span className="block overflow-hidden">
          <span data-nf-status className="block font-heading leading-none">
            <FuzzyText
              fontSize="clamp(5.5rem, 22vw, 19rem)"
              fontWeight={700}
              baseIntensity={0.12}
              hoverIntensity={0.5}
              fuzzRange={20}
              fps={60}
              direction="both"
              transitionDuration={400}
              glitchMode
              glitchInterval={GLITCH_INTERVAL}
              glitchDuration={GLITCH_DURATION}
              className="h-auto max-w-full"
            >
              {notFound.status}
            </FuzzyText>
          </span>
        </span>

        <span className="block overflow-hidden">
          <span data-nf-message className="block font-heading">
            <FuzzyText
              fontSize="clamp(1.125rem, 3vw, 2rem)"
              fontWeight={600}
              baseIntensity={0.12}
              hoverIntensity={0.5}
              fuzzRange={20}
              fps={60}
              direction="both"
              transitionDuration={400}
              letterSpacing={2}
              glitchMode
              glitchInterval={GLITCH_INTERVAL}
              glitchDuration={GLITCH_DURATION}
              className="h-auto max-w-full"
            >
              {notFound.message}
            </FuzzyText>
            <p className="sr-only">{notFound.message}</p>
          </span>
        </span>

        <span data-nf-action className="block">
          <Link
            ref={linkRef}
            href="/"
            aria-label="Back home"
            className="group inline-flex items-center gap-1.5 text-[1.0625rem] font-normal tracking-[-0.01em] text-black/70 transition-colors duration-300 hover:text-black"
          >
            <span className="smg-word">
              {LINK_TEXT.split("").map((char, index) => (
                <span key={index} className="smg-char-mask">
                  <span className="smg-char smg-char-a">{char === " " ? "\u00A0" : char}</span>
                  <span aria-hidden="true" className="smg-char smg-char-b">
                    {char === " " ? "\u00A0" : char}
                  </span>
                </span>
              ))}
            </span>
            <ArrowUpRight
              aria-hidden="true"
              weight="regular"
              className="size-[1.05rem] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </span>
      </div>

      <footer className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 px-[clamp(1.5rem,6vw,4.5rem)] pb-[clamp(1.5rem,4vh,2.75rem)]">
        <p
          data-nf-bottom
          className="text-[0.625rem] leading-none font-semibold tracking-[0.22em] text-black/45 uppercase"
        >
          {profile.location}
        </p>
        <p
          data-nf-bottom
          className="max-w-full truncate text-right text-[0.625rem] leading-none font-semibold tracking-[0.22em] text-black/45 uppercase"
        >
          {pathname || notFound.label}
        </p>
      </footer>
    </main>
  )
}
