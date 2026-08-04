"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { profile } from "@/lib/data";
import { prefersReducedMotion } from "@/lib/utils";
import { StaggeredMenu } from "@/components/ui/staggered-menu";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const TEXT_CYCLE = 3;

/** Page scroll (px) after which the full-bleed glass bar fades in. */
const GLASS_SCROLL = 72;

/**
 * Cycling Menu/Close sequence for the toggle. The label flips three times
 * before settling on the target, mimicking the React Bits staggered menu.
 */
function buildLines(opening: boolean) {
  const from = opening ? "Menu" : "Close";
  const to = opening ? "Close" : "Menu";

  if (prefersReducedMotion()) return [to];

  const seq = [from];
  let last = from;
  for (let i = 0; i < TEXT_CYCLE; i++) {
    last = last === "Menu" ? "Close" : "Menu";
    seq.push(last);
  }
  if (last !== to) seq.push(to);
  seq.push(to);
  return seq;
}

/**
 * Floating header: monogram left, premium Menu/Close toggle right. The toggle
 * controls the fullscreen b/w staggered menu (see StaggeredMenu). Text color
 * inverts to white while the black panel is open.
 */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const textInnerRef = useRef<HTMLSpanElement>(null);
  const spinRef = useRef<HTMLSpanElement>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const mountedRef = useRef(false);
  const lines = buildLines(open);

  const toggleMenu = () => setOpen((value) => !value);

  useEffect(() => {
    const inner = textInnerRef.current;
    const spin = spinRef.current;
    if (!inner) return;

    if (!mountedRef.current) {
      mountedRef.current = true;
      gsap.set(inner, {
        yPercent: -(((lines.length - 1) / lines.length) * 100),
      });
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(inner, { yPercent: 0 });
      spinTweenRef.current?.kill();
      gsap.set(spin, { rotate: open ? 225 : 0 });
      return;
    }

    gsap.set(inner, { yPercent: 0 });
    gsap.to(inner, {
      yPercent: -(((lines.length - 1) / lines.length) * 100),
      duration: 0.5 + lines.length * 0.07,
      ease: "power4.out",
      overwrite: true,
    });

    spinTweenRef.current?.kill();
    spinTweenRef.current = gsap.to(spin, {
      rotate: open ? 225 : 0,
      duration: open ? 0.8 : 0.35,
      ease: open ? "power4.out" : "power3.inOut",
      overwrite: "auto",
    });
  }, [open, lines]);

  useEffect(() => {
    return () => {
      spinTweenRef.current?.kill();
    };
  }, []);

  /**
   * Full-bleed navbar background lifecycle. ScrollTrigger fires `onToggle`
   * once per threshold crossing (GLASS_SCROLL px of page scroll), so the bar
   * is only ever faded in/out at boundaries — zero per-frame work and zero
   * backdrop cost while the hero is on screen (GSAP autoAlpha hides the bar
   * with `visibility`). The bar tweens `autoAlpha` + a subtle `y` drop in
   * (power3.out), and is instant under reduced motion.
   */
  useGSAP(
    () => {
      const bg = bgRef.current;
      if (!bg) return;

      gsap.set(bg, { autoAlpha: 0, y: -8 });

      const trigger = ScrollTrigger.create({
        start: GLASS_SCROLL,
        end: "max",
        onToggle: (self) => {
          const visible = self.isActive;
          if (prefersReducedMotion()) {
            gsap.set(bg, { autoAlpha: visible ? 1 : 0, y: visible ? 0 : -8 });
            return;
          }
          gsap.to(bg, {
            autoAlpha: visible ? 1 : 0,
            y: visible ? 0 : -8,
            duration: 0.55,
            ease: "power3.out",
            overwrite: "auto",
          });
        },
      });
      return () => trigger.kill();
    },
    { scope: headerRef }
  );

  return (
    <>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-5 pt-[max(1.25rem,env(safe-area-inset-top))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] text-black transition-colors duration-500 data-[open=true]:text-white sm:px-8 lg:pl-[clamp(2rem,2.3vw,2.5rem)] lg:pr-[clamp(2.75rem,3.3vw,3.5rem)]"
        data-open={open}
      >
        {/*
         * Full-bleed frosted bar behind the header content — sharp corners,
         * hairline bottom border, black while the menu is open. Always
         * mounted; GSAP fades it in/out across the scroll threshold.
         */}
        <div
          ref={bgRef}
          data-navbar-bg
          aria-hidden="true"
          className="navbar-bg pointer-events-none absolute inset-0"
          style={{
            WebkitBackdropFilter: "blur(16px) saturate(1.4)",
            backdropFilter: "blur(16px) saturate(1.4)",
          }}
        />

        <a
          data-hero-mono
          href="#home"
          aria-label={`${profile.name}, home`}
          className="relative text-2xl font-semibold leading-none tracking-[-0.03em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-4 focus-visible:ring-offset-white"
        >
          {profile.brand}
        </a>

        <button
          data-hero-menu-toggle
          type="button"
          onClick={toggleMenu}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls="staggered-menu-panel"
          className="smg-toggle relative"
        >
          <span className="smg-toggle-text" aria-hidden="true">
            <span ref={textInnerRef} className="smg-toggle-lines">
              {lines.map((label, i) => (
                <span key={i} className="smg-toggle-line">
                  {label}
                </span>
              ))}
            </span>
          </span>
          <span ref={spinRef} className="smg-toggle-icon" aria-hidden="true">
            <span className="smg-toggle-bar" />
            <span className="smg-toggle-bar smg-toggle-bar-v" />
          </span>
        </button>
      </header>

      <StaggeredMenu open={open} onOpenChange={setOpen} />
    </>
  );
}
