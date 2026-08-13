"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSmoothScroll } from "@/components/ui/smooth-scroll"
import {
  completeWipe,
  registerWipeCurtain,
  scrollToInstant,
  unregisterWipeCurtain,
  wipeCover,
  wipeCoverDeferred,
} from "@/lib/wipe"

const PANELS = 5

/**
 * The single, globally-mounted curtain wipe overlay (see `src/lib/wipe.ts`).
 * Mounted once in the root layout, it renders the five black bands and
 * registers itself so scroll-to-top, nav links and page transitions all share
 * one curtain.
 *
 * It also intercepts link clicks in the capture phase, before Next's Link
 * handler or any React onClick can react:
 *
 * - `a[href^="#"]` — in-page anchors (hero CTAs, monogram, footer links):
 *   default prevented, then the wipe plays and the target section scrolls
 *   into view while the screen is covered. Staggered-menu links pass through
 *   so the menu can close without replaying the page curtain.
 * - `a[href^="/"]` — internal route links (e.g. the 404 "Back home"): default
 *   prevented (Next Link bails on `defaultPrevented`), the curtain drops in
 *   instantly, `router.push` commits underneath, and the reveal is deferred
 *   until `PageTransition` sees the incoming route commit — so the new page
 *   can never appear before the reveal. Same-path clicks (`href` equal to the
 *   current route) reveal immediately since no commit will come.
 *
 * Modifier-key clicks, `target="_blank"`, `download`, `mailto:` and external
 * URLs pass through untouched. Back/forward navigation can't be intercepted,
 * so `PageTransition` plays the cover for those at `popstate` time instead.
 */
export function WipeCurtain() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelsRef = useRef<HTMLDivElement[]>([])
  const lenis = useSmoothScroll()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    registerWipeCurtain(overlay, panelsRef.current.filter(Boolean), lenis)
    return () => unregisterWipeCurtain()
  }, [lenis])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest("a")
      if (!anchor) return
      if (anchor.closest("#staggered-menu-panel")) return
      if (anchor.target === "_blank") return
      if (anchor.hasAttribute("download")) return

      const href = anchor.getAttribute("href")
      if (!href) return

      if (href.startsWith("#")) {
        event.preventDefault()
        const targetId = href.slice(1)
        wipeCover(() => {
          const section = targetId ? document.getElementById(targetId) : null
          scrollToInstant(section ?? 0)
        })
        return
      }

      if (href.startsWith("/") && !href.startsWith("//")) {
        event.preventDefault()
        wipeCoverDeferred(() => {
          if (href === pathname) {
            completeWipe()
            return
          }
          router.push(href)
        })
      }
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [router, pathname])

  return (
    <div
      ref={overlayRef}
      data-wipe-curtain
      aria-hidden="true"
      className="stt-curtain"
      style={{ display: "none" }}
    >
      {Array.from({ length: PANELS }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) panelsRef.current[i] = el
          }}
          className="stt-curtain-panel"
        />
      ))}
    </div>
  )
}
