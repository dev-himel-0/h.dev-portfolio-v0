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
 * curtain bands sweep in from the right (0.07s apart, power4.out), then a
 * fullscreen black panel slides over them with numbered Outfit items, a mono
 * email/availability footer and a socials row. All entrance/exit choreography
 * is a single GSAP timeline — timing mirrors the upstream component exactly.
 *
 * The toggle button lives in the Navbar (this component only holds the overlay),
 * so state is controlled via `open` / `onOpenChange`.
 */
const PRELAYER_COLORS = ["#000000", "#0a0a0a", "#161616"] as const;

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
    gsap.set(panel.querySelectorAll("[data-menu-item-label]"), { yPercent: 0, rotate: 0 });
    gsap.set(panel.querySelectorAll("[data-menu-item-label]"), { clearProps: "transform" });
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

    // Curtain sweep — 0.5s, power4.out, 0.07s apart (exact React Bits timing).
    prelayers.forEach((el, i) => {
      tl.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, i * 0.07);
    });
    const lastTime = (prelayers.length - 1) * 0.07;

    // Panel insertion — lastTime + 0.08, 0.65s, power4.out.
    const panelInsertTime = lastTime + (prelayers.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(
      panel,
      { xPercent: 100 },
      { xPercent: 0, duration: panelDuration, ease: "power4.out" },
      panelInsertTime
    );

    // Items — begin 15% into the panel slide, yPercent 140→0 + rotate 10→0.
    if (labels.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(
        labels,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: "power4.out",
          stagger: { each: 0.1 },
          onComplete: () => {
            gsap.set(labels, { clearProps: "transform" });
          },
        },
        itemsStart
      );
      tl.to(
        rows,
        { "--sm-num-opacity": 1, duration: 0.6, ease: "power2.out", stagger: 0.08 },
        itemsStart + 0.1
      );
    }

    // Footer — socials at 40% into the panel slide.
    const socialsStart = panelInsertTime + panelDuration * 0.4;
    const footerStatic = [footerLead, socialsTitle, footerNote].filter(Boolean);
    if (footerStatic.length) {
      tl.to(footerStatic, { opacity: 1, duration: 0.5, ease: "power2.out" }, socialsStart);
    }
    if (links.length) {
      tl.to(
        links,
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: "power3.out",
          stagger: { each: 0.08 },
          onComplete: () => {
            gsap.set(links, { clearProps: "opacity" });
          },
        },
        socialsStart + 0.04
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
      duration: 0.32,
      ease: "power3.in",
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
                    <span data-menu-item-label className="smg-item-label">
                      {item.label}
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
                    <li key={s.label + i}>
                      <a
                        data-menu-social-link
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