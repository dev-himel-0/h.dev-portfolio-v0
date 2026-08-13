"use client"

import { useCallback, useEffect, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { CustomEase } from "gsap/CustomEase"
import { EnvelopeSimple, GithubLogo, LinkedinLogo, XLogo } from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"
import { navigation, profile, socials } from "@/lib/data"
import type { SocialIcon } from "@/lib/data"
import { useSmoothScroll } from "@/components/ui/smooth-scroll"

gsap.registerPlugin(CustomEase)

/**
 * Fullscreen b/w menu, adapted from React Bits' StaggeredMenu and Yunox. Three
 * dark curtain folds sweep in from the right, then the transparent menu surface
 * and its content fade over them with numbered General Sans items, a Montserrat
 * email/availability footer and a socials row. All entrance/exit choreography
 * is a single GSAP timeline.
 *
 * The toggle button lives in the Navbar (this component only holds the overlay),
 * so state is controlled via `open` / `onOpenChange`.
 */
const PRELAYER_COLORS = ["#000000", "#0a0a0a", "#161616"] as const
const YUNOX_MENU_EASE = CustomEase.create("yunox-menu", "M0,0 C0.12,0.23 0.5,1 1,1")

/**
 * Entrance/exit choreography timings (s). The fold cadence and overlap mirror
 * Yunox while the content remains a separate, stationary fade layer.
 */
const MENU_TIMING = {
  curtainDuration: 0.6,
  curtainStagger: 0.25,
  panelDuration: 0.8,
  contentDelay: 0.75,
  itemDelay: 0.6,
  itemDuration: 0.4,
  itemStagger: 0.2,
  numberDuration: 0.4,
  numberDelay: 0,
  numberHoverDuration: 0.5,
  numberHoverScale: 1.3,
  footerLeadGap: 0.35,
  footerDuration: 0.45,
  socialStagger: 0.08,
  socialDelay: 0.04,
  closeDuration: 0.3,
  itemHoverDuration: 0.65,
  itemHoverStagger: 0.03,
} as const

export function StaggeredMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const openRef = useRef(open)
  const openTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const closeTweenRef = useRef<gsap.core.Timeline | null>(null)
  const hasInteractedRef = useRef(false)
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const lenis = useSmoothScroll()

  useLayoutEffect(() => {
    openRef.current = open
  }, [open])

  /**
   * Initial closed item states — before opening, after closing, on mount.
   * The masks use Yunox's compact 30px rise while the curtain timing follows
   * the horizontal layered reveal.
   */
  const resetClosed = useCallback(() => {
    const root = rootRef.current
    const panel = panelRef.current
    if (!root || !panel) return
    gsap.set(panel.querySelectorAll("[data-menu-item-label]"), {
      y: 30,
      rotate: 0,
      opacity: 0,
    })
    gsap.set(panel.querySelectorAll<HTMLElement>(".smg-item"), {
      "--sm-num-rise": "180%",
      "--sm-num-rot": "15deg",
      "--sm-num-scale": 1,
      "--sm-num-opacity": 0,
    })
    gsap.set(
      [
        ...Array.from(panel.querySelectorAll("[data-menu-footer-lead]")),
        ...Array.from(panel.querySelectorAll("[data-menu-socials-title]")),
        ...Array.from(panel.querySelectorAll("[data-menu-footer-note]")),
      ],
      { opacity: 0 },
    )
    gsap.set(panel.querySelectorAll("[data-menu-social-link]"), { y: 25, opacity: 0 })
    gsap.set(panel.querySelectorAll(".smg-char-a"), { yPercent: 0 })
    gsap.set(panel.querySelectorAll(".smg-char-b"), { yPercent: 100 })
  }, [])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const root = rootRef.current
      const panel = panelRef.current
      if (!root || !panel) return

      gsap.set(root.querySelectorAll("[data-menu-prelayer]"), {
        xPercent: 100,
        autoAlpha: 1,
      })
      gsap.set(panel, { xPercent: 0, autoAlpha: 0 })
      resetClosed()
    }, rootRef)
    return () => ctx.revert()
  }, [resetClosed])

  const playOpen = useCallback(() => {
    const root = rootRef.current
    const panel = panelRef.current
    if (!root || !panel) return

    openTimelineRef.current?.kill()
    closeTweenRef.current?.kill()
    closeTweenRef.current = null

    const prelayers = Array.from(root.querySelectorAll<HTMLElement>("[data-menu-prelayer]"))
    const labels = Array.from(panel.querySelectorAll("[data-menu-item-label]"))
    const anchors = Array.from(panel.querySelectorAll<HTMLElement>(".smg-item"))
    const footerLead = panel.querySelector("[data-menu-footer-lead]")
    const socialsTitle = panel.querySelector("[data-menu-socials-title]")
    const footerNote = panel.querySelector("[data-menu-footer-note]")
    const links = Array.from(panel.querySelectorAll("[data-menu-social-link]"))

    gsap.set(panel, { xPercent: 0, visibility: "visible", opacity: 0 })
    resetClosed()

    const tl = gsap.timeline({ paused: true })

    // Yunox-style layered sweep — three folds enter from right to left while
    // overlapping by 250ms, leaving the menu surface stationary underneath.
    prelayers.forEach((el, i) => {
      tl.fromTo(
        el,
        { xPercent: 100 },
        {
          xPercent: 0,
          duration: MENU_TIMING.curtainDuration,
          ease: YUNOX_MENU_EASE,
        },
        i * MENU_TIMING.curtainStagger,
      )
    })

    // The surface does not travel horizontally. It fades over the folds once
    // the reference reveal has established its layered depth.
    tl.to(
      panel,
      { opacity: 1, duration: MENU_TIMING.panelDuration, ease: YUNOX_MENU_EASE },
      MENU_TIMING.contentDelay,
    )

    // Links begin just before the surface fade, matching the reference's
    // overlapping content reveal rather than waiting for the folds to finish.
    const itemsStart = MENU_TIMING.itemDelay
    const cascadeEnd =
      itemsStart + MENU_TIMING.itemDuration + (labels.length - 1) * MENU_TIMING.itemStagger

    if (labels.length) {
      tl.to(
        labels,
        {
          y: 0,
          rotate: 0,
          opacity: 1,
          duration: MENU_TIMING.itemDuration,
          ease: YUNOX_MENU_EASE,
          stagger: { each: MENU_TIMING.itemStagger },
          onComplete: () => {
            gsap.set(labels, { clearProps: "transform,opacity" })
          },
        },
        itemsStart,
      )
      tl.to(
        anchors,
        {
          "--sm-num-rise": "0%",
          "--sm-num-rot": "0deg",
          "--sm-num-opacity": 1,
          duration: MENU_TIMING.numberDuration,
          ease: YUNOX_MENU_EASE,
          stagger: { each: MENU_TIMING.itemStagger },
        },
        itemsStart + MENU_TIMING.numberDelay,
      )
    }

    // Footer — anchored just before the cascade ends so it settles as the
    // final link lands (panel-fraction fallback if no nav items exist).
    const socialsStart = labels.length
      ? cascadeEnd - MENU_TIMING.footerLeadGap
      : MENU_TIMING.contentDelay + MENU_TIMING.panelDuration * 0.28
    const footerStatic = [footerLead, socialsTitle, footerNote].filter(Boolean)
    if (footerStatic.length) {
      tl.to(
        footerStatic,
        { opacity: 1, duration: MENU_TIMING.footerDuration, ease: YUNOX_MENU_EASE },
        socialsStart,
      )
    }
    if (links.length) {
      tl.to(
        links,
        {
          y: 0,
          opacity: 1,
          duration: MENU_TIMING.footerDuration,
          ease: YUNOX_MENU_EASE,
          stagger: { each: MENU_TIMING.socialStagger },
          onComplete: () => {
            gsap.set(links, { clearProps: "opacity" })
          },
        },
        socialsStart + MENU_TIMING.socialDelay,
      )
    }

    openTimelineRef.current = tl
    tl.play(0)
  }, [resetClosed])

  const playClose = useCallback(() => {
    const root = rootRef.current
    const panel = panelRef.current
    if (!root || !panel) return

    openTimelineRef.current?.kill()
    openTimelineRef.current = null
    closeTweenRef.current?.kill()

    const prelayers = Array.from(root.querySelectorAll<HTMLElement>("[data-menu-prelayer]"))
    const closeTimeline = gsap.timeline({
      onComplete: () => {
        gsap.set(panel, { autoAlpha: 0 })
        resetClosed()
      },
    })

    // The surface clears first, then the folds peel away from front to back.
    // A reverse stagger preserves the three-layer read on the way out.
    closeTimeline.to(panel, {
      opacity: 0,
      duration: MENU_TIMING.closeDuration,
      ease: "power3.in",
      overwrite: "auto",
    })
    if (prelayers.length) {
      closeTimeline.to(
        prelayers,
        {
          xPercent: 100,
          duration: MENU_TIMING.curtainDuration,
          ease: YUNOX_MENU_EASE,
          stagger: { each: MENU_TIMING.curtainStagger, from: "end" },
          overwrite: "auto",
        },
        0,
      )
    }
    closeTweenRef.current = closeTimeline
  }, [resetClosed])

  useEffect(() => {
    if (open) {
      hasInteractedRef.current = true
      playOpen()
    } else if (hasInteractedRef.current) {
      playClose()
    }
  }, [open, playOpen, playClose])

  useEffect(() => {
    if (open) lenis?.stop()
    else lenis?.start()
  }, [open, lenis])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && openRef.current) onOpenChange(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onOpenChange])

  useEffect(() => {
    if (!open) return

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusFrame = window.requestAnimationFrame(() => {
      firstMenuLinkRef.current?.focus()
    })

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return

      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      ).filter((element) => !element.hidden && element.getClientRects().length > 0)

      if (!focusable.length) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleTab)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener("keydown", handleTab)
      restoreFocusRef.current?.focus()
      restoreFocusRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!(target instanceof Element)) return
      if (target.closest("[data-hero-menu-toggle]")) return
      if (rootRef.current?.contains(target)) return
      onOpenChange(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [open, onOpenChange])

  const close = useCallback(() => {
    if (openRef.current) onOpenChange(false)
  }, [onOpenChange])

  /**
   * Letter-wave hover: chars are pre-split per row (`.smg-char-mask` with a
   * resting `.smg-char-a` and a blank `.smg-char-b` parked one line below).
   * On hover the resting copy rolls up out of the mask while the duplicate
   * rolls in from below — a 0.03s stagger, 0.65s `power4.inOut`. The row
   * number scales up 1→1.3 on the same tween (via `--sm-num-scale`). Pointer
   * enter/leave are bound directly on each row (no bubbling surprises) and
   * killed on unmount.
   */
  useLayoutEffect(() => {
    const root = rootRef.current
    const panel = panelRef.current
    if (!root || !panel) return

    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-menu-item]"))
    const resetChars = () => {
      root
        .querySelectorAll<HTMLElement>(".smg-char-a")
        .forEach((el) => gsap.set(el, { yPercent: 0 }))
      root
        .querySelectorAll<HTMLElement>(".smg-char-b")
        .forEach((el) => gsap.set(el, { yPercent: 100 }))
    }

    const wave = (row: HTMLElement, on: boolean) => {
      const anchor = row.querySelector<HTMLElement>(".smg-item")
      if (anchor) {
        gsap.to(anchor, {
          "--sm-num-scale": on ? MENU_TIMING.numberHoverScale : 1,
          duration: MENU_TIMING.numberHoverDuration,
          ease: "power4.out",
          overwrite: "auto",
        })
      }
      const rest = Array.from(row.querySelectorAll<HTMLElement>(".smg-char-a"))
      const clone = Array.from(row.querySelectorAll<HTMLElement>(".smg-char-b"))
      if (!rest.length || !clone.length) return
      gsap.to(rest, {
        yPercent: on ? -100 : 0,
        duration: MENU_TIMING.itemHoverDuration,
        ease: "power4.inOut",
        stagger: { each: MENU_TIMING.itemHoverStagger },
        overwrite: "auto",
      })
      gsap.to(clone, {
        yPercent: on ? 0 : 100,
        duration: MENU_TIMING.itemHoverDuration,
        ease: "power4.inOut",
        stagger: { each: MENU_TIMING.itemHoverStagger },
        overwrite: "auto",
      })
    }

    resetChars()

    const inHandlers = rows.map((row) => {
      const enter = () => wave(row, true)
      const leave = () => wave(row, false)
      row.addEventListener("pointerenter", enter)
      row.addEventListener("pointerleave", leave)
      return { row, enter, leave }
    })

    return () => {
      inHandlers.forEach(({ row, enter, leave }) => {
        row.removeEventListener("pointerenter", enter)
        row.removeEventListener("pointerleave", leave)
      })
      root.querySelectorAll<HTMLElement>(".smg-char").forEach((el) => gsap.killTweensOf(el))
      root.querySelectorAll<HTMLElement>(".smg-item").forEach((el) => gsap.killTweensOf(el))
    }
  }, [])

  const SOCIAL_ICON: Record<SocialIcon, Icon> = {
    github: GithubLogo,
    linkedin: LinkedinLogo,
    x: XLogo,
    email: EnvelopeSimple,
  }

  return (
    <div ref={rootRef} className="smg" data-open={open || undefined}>
      <div aria-hidden="true" className="smg-prelayers">
        {PRELAYER_COLORS.map((color) => (
          <span
            key={color}
            data-menu-prelayer
            className="smg-prelayer"
            style={{ background: color }}
          />
        ))}
      </div>

      <aside
        ref={panelRef}
        id="staggered-menu-panel"
        role="dialog"
        className="smg-panel"
        data-lenis-prevent
        aria-label="Menu"
        aria-modal="true"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="smg-inner">
          <nav aria-label="Menu">
            <ul className="smg-list" role="list">
              {navigation.map((item, index) => (
                <li key={item.href} data-menu-item className="smg-item-wrap">
                  <a
                    ref={index === 0 ? firstMenuLinkRef : undefined}
                    href={item.href}
                    className="smg-item"
                    onClick={close}
                    aria-label={item.label}
                  >
                    <span data-menu-item-label className="smg-item-mask">
                      <span className="smg-word">
                        {item.label.split("").map((char, index) => (
                          <span key={index} className="smg-char-mask">
                            <span className="smg-char smg-char-a">
                              {char === " " ? "\u00A0" : char}
                            </span>
                            <span aria-hidden="true" className="smg-char smg-char-b">
                              {char === " " ? "\u00A0" : char}
                            </span>
                          </span>
                        ))}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <footer className="smg-footer">
            <div data-menu-footer-lead className="smg-footer-lead">
              <a className="smg-email" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
              <p className="smg-availability">
                <span aria-hidden="true" className="smg-dot" />
                {profile.availability}
              </p>
            </div>

            <div className="smg-socials">
              <span data-menu-socials-title className="smg-socials-label">
                Socials
              </span>
              <ul className="smg-socials-list" role="list">
                {socials.map((s, i) => {
                  const href = s.href || undefined
                  const SocialIcon = SOCIAL_ICON[s.icon]
                  return (
                    <li key={s.label + i} data-menu-social-link>
                      <a
                        className="smg-social"
                        href={href}
                        target={href ? "_blank" : undefined}
                        rel={href ? "noopener noreferrer" : undefined}
                      >
                        <SocialIcon aria-hidden="true" weight="fill" className="smg-social-icon" />
                        <span className="smg-social-label">{s.label}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>

            <p data-menu-footer-note className="smg-footer-note">
              {profile.name} — {profile.location}
            </p>
          </footer>
        </div>
      </aside>
    </div>
  )
}
