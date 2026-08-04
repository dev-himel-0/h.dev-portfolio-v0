"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import {
  ArrowUpRight,
  EnvelopeSimple,
  GithubLogo,
  LinkedinLogo,
  XLogo,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { navigation, profile, socials } from "@/lib/data";
import type { SocialIcon } from "@/lib/data";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * Fullscreen b/w menu, adapted from React Bits' StaggeredMenu. Three black
 * curtain folds sweep in from the right (0.07s apart, power4.out), then a
 * fullscreen black panel slides over them with numbered Outfit items, a mono
 * email/availability footer and a socials row. All entrance/exit choreography
 * is a single GSAP timeline (timings in MENU_TIMING).
 *
 * The toggle button lives in the Navbar (this component only holds the overlay),
 * so state is controlled via `open` / `onOpenChange`.
 */
const PRELAYER_COLORS = ["#000000", "#0a0a0a", "#161616"] as const;

/**
 * Entrance/exit choreography timings (s) — the classic theatrical opening:
 * three curtain folds sweep in 0.07s apart, the panel pushes in on their
 * tail, then the nav links rise one at a time (1.0s each, 0.1s stagger,
 * yPercent 140 + rotate 10, power4.out) with an opacity fade, settling the
 * last link around ~1.5s. The footer/socials are anchored just before the
 * end of that cascade so they settle as the final link lands. GSAP animates
 * only elements with no CSS transform/opacity transition
 * (`[data-menu-item-label]` mask, social `<li>`) so nothing fights the tween.
 */
const MENU_TIMING = {
  curtainDuration: 0.5,
  curtainStagger: 0.07,
  panelDelay: 0.08,
  panelDuration: 0.65,
  itemStartPct: 0.15,
  itemDuration: 1.0,
  itemStagger: 0.1,
  numberDuration: 0.6,
  numberDelay: 0.1,
  footerLeadGap: 0.45,
  footerDuration: 0.5,
  socialStagger: 0.08,
  socialDelay: 0.04,
  closeDuration: 0.32,
} as const;

export function StaggeredMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const openRef = useRef(open);
  const openTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);
  const lenis = useLenis();

  useLayoutEffect(() => {
    openRef.current = open;
  }, [open]);

  /**
   * Initial closed item states — before opening, after closing, on mount.
   * Values match React Bits (yPercent 140 / rotate 10, socials y 25).
   */
  const resetClosed = useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    gsap.set(panel.querySelectorAll("[data-menu-item-label]"), {
      yPercent: 140,
      rotate: 10,
      opacity: 0,
    });
    gsap.set(panel.querySelectorAll("[data-menu-item]"), { "--sm-num-opacity": 0 });
    gsap.set(
      [
        ...Array.from(panel.querySelectorAll("[data-menu-footer-lead]")),
        ...Array.from(panel.querySelectorAll("[data-menu-socials-title]")),
        ...Array.from(panel.querySelectorAll("[data-menu-footer-note]")),
      ],
      { opacity: 0 }
    );
    gsap.set(panel.querySelectorAll("[data-menu-social-link]"), { y: 25, opacity: 0 });
  }, []);

  /** Instant open (prefers-reduced-motion): everything visible, no tween. */
  const finishOpen = useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    gsap.set(root.querySelectorAll("[data-menu-prelayer]"), { xPercent: 0, autoAlpha: 1 });
    gsap.set(panel, { xPercent: 0, autoAlpha: 1 });
    gsap.set(panel.querySelectorAll("[data-menu-item-label]"), {
      yPercent: 0,
      rotate: 0,
      opacity: 1,
    });
    gsap.set(panel.querySelectorAll("[data-menu-item-label]"), {
      clearProps: "transform,opacity",
    });
    gsap.set(panel.querySelectorAll("[data-menu-item]"), { "--sm-num-opacity": 1 });
    gsap.set(
      [
        ...Array.from(panel.querySelectorAll("[data-menu-footer-lead]")),
        ...Array.from(panel.querySelectorAll("[data-menu-socials-title]")),
        ...Array.from(panel.querySelectorAll("[data-menu-footer-note]")),
      ],
      { opacity: 1 }
    );
    gsap.set(panel.querySelectorAll("[data-menu-social-link]"), { y: 0, opacity: 1 });
  }, []);

  /** Instant close (prefers-reduced-motion): everything offscreen. */
  const finishClose = useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    gsap.set(
      [...Array.from(root.querySelectorAll("[data-menu-prelayer]")), panel],
      { xPercent: 100, autoAlpha: 0 }
    );
    resetClosed();
  }, [resetClosed]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const root = rootRef.current;
      const panel = panelRef.current;
      if (!root || !panel) return;

      gsap.set(root.querySelectorAll("[data-menu-prelayer]"), {
        xPercent: 100,
        autoAlpha: 1,
      });
      gsap.set(panel, { xPercent: 100, autoAlpha: 0 });
      resetClosed();
    }, rootRef);
    return () => ctx.revert();
  }, [resetClosed]);

  const playOpen = useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel || busyRef.current) return;

    if (prefersReducedMotion()) {
      finishOpen();
      return;
    }

    busyRef.current = true;
    openTimelineRef.current?.kill();
    closeTweenRef.current?.kill();
    closeTweenRef.current = null;

    const prelayers = Array.from(root.querySelectorAll<HTMLElement>("[data-menu-prelayer]"));
    const labels = Array.from(panel.querySelectorAll("[data-menu-item-label]"));
    const rows = Array.from(panel.querySelectorAll("[data-menu-item]"));
    const footerLead = panel.querySelector("[data-menu-footer-lead]");
    const socialsTitle = panel.querySelector("[data-menu-socials-title]");
    const footerNote = panel.querySelector("[data-menu-footer-note]");
    const links = Array.from(panel.querySelectorAll("[data-menu-social-link]"));

    gsap.set(panel, { autoAlpha: 1 });
    resetClosed();

    const tl = gsap.timeline({ paused: true });

    // Curtain sweep — three folds cascade in, 0.07s apart (classic opening).
    prelayers.forEach((el, i) => {
      tl.fromTo(
        el,
        { xPercent: 100 },
        { xPercent: 0, duration: MENU_TIMING.curtainDuration, ease: "power4.out" },
        i * MENU_TIMING.curtainStagger
      );
    });
    const lastTime = (prelayers.length - 1) * MENU_TIMING.curtainStagger;

    // Panel insertion — slides in on the folds' tail, 0.65s power4.out.
    const panelInsertTime = lastTime + (prelayers.length ? MENU_TIMING.panelDelay : 0);
    const panelDuration = MENU_TIMING.panelDuration;
    tl.fromTo(
      panel,
      { xPercent: 100 },
      { xPercent: 0, duration: panelDuration, ease: "power4.out" },
      panelInsertTime
    );

    // Items — begin 15% into the panel slide: each masked label rises 1.0s
    // with a 0.1s stagger, yPercent 140→0 + rotate 10→0 (power4.out) and a
    // soft opacity fade.
    const itemsStart = panelInsertTime + panelDuration * MENU_TIMING.itemStartPct;
    const cascadeEnd =
      itemsStart + MENU_TIMING.itemDuration + (labels.length - 1) * MENU_TIMING.itemStagger;

    if (labels.length) {
      tl.to(
        labels,
        {
          yPercent: 0,
          rotate: 0,
          opacity: 1,
          duration: MENU_TIMING.itemDuration,
          ease: "power4.out",
          stagger: { each: MENU_TIMING.itemStagger },
          onComplete: () => {
            gsap.set(labels, { clearProps: "transform,opacity" });
          },
        },
        itemsStart
      );
      tl.to(
        rows,
        {
          "--sm-num-opacity": 1,
          duration: MENU_TIMING.numberDuration,
          ease: "power2.out",
          stagger: { each: MENU_TIMING.itemStagger },
        },
        itemsStart + MENU_TIMING.numberDelay
      );
    }

    // Footer — anchored just before the cascade ends so it settles as the
    // final link lands (panel-fraction fallback if no nav items exist).
    const socialsStart = labels.length
      ? cascadeEnd - MENU_TIMING.footerLeadGap
      : panelInsertTime + panelDuration * 0.28;
    const footerStatic = [footerLead, socialsTitle, footerNote].filter(Boolean);
    if (footerStatic.length) {
      tl.to(
        footerStatic,
        { opacity: 1, duration: MENU_TIMING.footerDuration, ease: "power2.out" },
        socialsStart
      );
    }
    if (links.length) {
      tl.to(
        links,
        {
          y: 0,
          opacity: 1,
          duration: MENU_TIMING.footerDuration,
          ease: "power3.out",
          stagger: { each: MENU_TIMING.socialStagger },
          onComplete: () => {
            gsap.set(links, { clearProps: "opacity" });
          },
        },
        socialsStart + MENU_TIMING.socialDelay
      );
    }

    tl.eventCallback("onComplete", () => {
      busyRef.current = false;
    });

    openTimelineRef.current = tl;
    tl.play(0);
  }, [finishOpen, resetClosed]);

  const playClose = useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel || busyRef.current) return;

    if (prefersReducedMotion()) {
      finishClose();
      return;
    }

    busyRef.current = true;
    openTimelineRef.current?.kill();
    openTimelineRef.current = null;
    closeTweenRef.current?.kill();

    const prelayers = Array.from(root.querySelectorAll("[data-menu-prelayer]"));
    closeTweenRef.current = gsap.to([...prelayers, panel], {
      xPercent: 100,
      duration: MENU_TIMING.closeDuration,
      ease: "power3.inOut",
      overwrite: "auto",
      onComplete: () => {
        resetClosed();
        busyRef.current = false;
      },
    });
  }, [finishClose, resetClosed]);

  useEffect(() => {
    if (open) playOpen();
    else playClose();
  }, [open, playOpen, playClose]);

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && openRef.current) onOpenChange(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-hero-menu-toggle]")) return;
      if (rootRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onOpenChange]);

  const close = useCallback(() => {
    if (openRef.current) onOpenChange(false);
  }, [onOpenChange]);

  const SOCIAL_ICON: Record<SocialIcon, Icon> = {
    github: GithubLogo,
    linkedin: LinkedinLogo,
    x: XLogo,
    email: EnvelopeSimple,
  };

  return (
    <div ref={rootRef} className="smg" data-open={open || undefined}>
      <div aria-hidden="true" className="smg-prelayers">
        {PRELAYER_COLORS.map((color) => (
          <span key={color} data-menu-prelayer className="smg-prelayer" style={{ background: color }} />
        ))}
      </div>

      <aside
        ref={panelRef}
        id="staggered-menu-panel"
        className="smg-panel"
        aria-label="Menu"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="smg-inner">
          <nav aria-label="Menu">
            <ul className="smg-list" role="list">
              {navigation.map((item) => (
                <li key={item.href} data-menu-item className="smg-item-wrap">
                  <a href={item.href} className="smg-item" onClick={close}>
                    <span data-menu-item-label className="smg-item-mask">
                      <span className="smg-item-label">{item.label}</span>
                    </span>
                    <span aria-hidden="true" className="smg-item-arrow">
                      <ArrowUpRight />
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
                  const href = s.href || undefined;
                  const SocialIcon = SOCIAL_ICON[s.icon];
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
                  );
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
  );
}