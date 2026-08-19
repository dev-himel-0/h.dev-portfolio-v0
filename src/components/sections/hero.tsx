"use client";

import { Navbar } from "@/components/sections/navbar";
import { FlipLink } from "@/components/ui/flip-link";
import { hero, profile } from "@/lib/data";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const actionIcons = {
  "arrow-up-right": ArrowUpRight,
};

/**
 * Gap between the preloader wipe starting and the hero's first beat. The
 * terminal wipe (content fade 0.4 + 0.1 offset + 5 bands × 1.0s power4.inOut
 * / 0.08 stagger) fully clears ~1.8s after wipe-start. The timeline begins
 * just as the last bands leave, so every beat below plays on an open screen.
 */
const ENTRANCE_DELAY_S = 1.65;

export function Hero({
  isRevealed,
  entranceDelay = ENTRANCE_DELAY_S,
}: {
  isRevealed: boolean;
  entranceDelay?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!isRevealed) return;

      const root = rootRef.current;
      if (!root) return;

      const select = (selector: string) =>
        Array.from(root.querySelectorAll<HTMLElement>(selector));
      const heroLines = select("[data-hero-line]");
      const scrollArrow = select("[data-scroll-arrow]");
      const heroActions = select("[data-hero-action]");
      const scrollLine = select("[data-scroll-line]");
      const scrollChevron = select("[data-scroll-chevron]");
      const heroGreeting = select("[data-hero-greeting]");
      const heroMono = select("[data-hero-mono]");
      const heroMenuToggle = select("[data-hero-menu-toggle]");
      const filledHeroLine = select("[data-hero-line='filled']");
      const outlinedHeroLine = select("[data-hero-line='outlined']");
      const heroTitleParallax = select("[data-hero-title-parallax]");
      const heroGreetingParallax = select("[data-hero-greeting-parallax]");
      const heroActionsParallax = select("[data-hero-actions-parallax]");
      const heroScroll = select("[data-hero-scroll]");
      const parallaxTargets = [
        ...heroTitleParallax,
        ...heroGreetingParallax,
        ...heroActionsParallax,
        ...heroScroll,
      ];
      const willChangeTargets = [
        ...heroLines,
        ...scrollArrow,
        ...scrollLine,
        ...scrollChevron,
        ...heroActions,
      ];

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reducedMotion) {
        gsap.set(
          [
            ...heroGreeting,
            ...heroMono,
            ...heroMenuToggle,
            ...heroLines,
            ...heroActions,
          ],
          { clearProps: "transform,opacity,visibility" },
        );
        gsap.set(scrollLine, { scaleY: 1, clearProps: "willChange" });
        gsap.set(scrollChevron, {
          autoAlpha: 1,
          y: 0,
          clearProps: "willChange",
        });
        return;
      }

      gsap.set(heroLines, { willChange: "transform" });
      gsap.set(scrollArrow, {
        willChange: "transform,opacity",
      });
      gsap.set(heroActions, { willChange: "transform,opacity" });
      gsap.set(scrollLine, {
        scaleY: 0,
        transformOrigin: "50% 0%",
        transformBox: "fill-box",
        willChange: "transform",
      });
      gsap.set(scrollChevron, {
        autoAlpha: 0,
        y: 6,
        willChange: "transform,opacity",
      });

      const timeline = gsap.timeline({
        delay: entranceDelay,
        defaults: { ease: "power4.out" },
        onComplete: () => {
          gsap.set(willChangeTargets, { clearProps: "willChange" });
        },
      });

      timeline
        .from(heroMono, { y: -12, autoAlpha: 0, duration: 0.55 }, 0.1)
        .from(heroMenuToggle, { y: -10, autoAlpha: 0, duration: 0.5 }, 0.22)
        .from(
          filledHeroLine,
          { yPercent: 110, autoAlpha: 0, duration: 1, ease: "expo.out" },
          0.34,
        )
        .from(
          outlinedHeroLine,
          { yPercent: 110, autoAlpha: 0, duration: 1.05, ease: "expo.out" },
          0.44,
        )
        .from(
          heroGreeting,
          { y: 10, autoAlpha: 0, duration: 0.5, ease: "power3.out" },
          0.92,
        )
        .from(
          heroActions,
          { y: 18, autoAlpha: 0, duration: 0.7, stagger: 0.1 },
          1.08,
        )
        .to(
          scrollLine,
          { scaleY: 1, duration: 0.9, ease: "power3.inOut" },
          1.32,
        )
        .to(
          scrollChevron,
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
          1.82,
        );

      const parallaxMedia = gsap.matchMedia();

      parallaxMedia.add(
        "(prefers-reduced-motion: no-preference) and (min-width: 810px)",
        () => {
          const desktop = () =>
            window.matchMedia("(min-width: 1024px)").matches;
          const tablet = () => window.matchMedia("(min-width: 640px)").matches;

          gsap.to(scrollArrow, {
            y: -10,
            duration: 1.1,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: entranceDelay + 2.15,
          });

          const parallaxTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top top",
              end: () =>
                Math.max(
                  1,
                  rootRef.current?.offsetHeight ?? window.innerHeight,
                ),
              scrub: 0.7,
              invalidateOnRefresh: true,
              onToggle: (self) =>
                gsap.set(parallaxTargets, {
                  willChange: self.isActive ? "transform,opacity" : "auto",
                }),
            },
          });

          parallaxTimeline
            .to(
              heroTitleParallax,
              {
                y: () => (desktop() ? -82 : tablet() ? -54 : -32),
                scale: () => (desktop() ? 0.93 : tablet() ? 0.95 : 0.97),
                opacity: () => (desktop() ? 0.82 : tablet() ? 0.88 : 0.94),
                transformOrigin: "50% 50%",
                duration: 1,
                ease: "none",
              },
              0,
            )
            .to(
              heroGreetingParallax,
              {
                y: () => (desktop() ? -30 : tablet() ? -20 : -12),
                opacity: () => (desktop() ? 0.55 : tablet() ? 0.68 : 0.8),
                duration: 1,
                ease: "none",
              },
              0,
            )
            .to(
              heroActionsParallax,
              {
                y: () => (desktop() ? 24 : tablet() ? 16 : 8),
                opacity: () => (desktop() ? 0.65 : tablet() ? 0.78 : 0.86),
                duration: 1,
                ease: "none",
              },
              0,
            )
            .to(
              heroScroll,
              {
                y: -64,
                opacity: 0,
                duration: 0.28,
                ease: "none",
              },
              0,
            );
        },
      );

      return () => parallaxMedia.revert();
    },
    {
      scope: rootRef,
      dependencies: [entranceDelay, isRevealed],
      revertOnUpdate: true,
    },
  );

  return (
    <div
      ref={rootRef}
      className="relative min-h-[100svh] w-full max-w-full overflow-hidden bg-white font-heading text-black"
    >
      <Navbar />

      <section
        id="home"
        aria-labelledby="hero-heading"
        className="hero-section relative flex min-h-[100svh] items-center"
      >
        <div className="hero-shell relative z-10 mx-auto flex w-full max-w-[96rem] items-center justify-center">
          <div className="hero-lockup w-full">
            <div className="hero-name-frame">
              <div
                data-hero-title-parallax
                className="hero-title-stage"
              >
                <h1
                  id="hero-heading"
                  className="hero-title w-full font-bold"
                >
                  <span className="hero-title-word">
                    <span className="hero-title-word-mask">
                      <span
                        data-hero-line="filled"
                        className="block whitespace-nowrap"
                      >
                        {hero.filledTitle}
                      </span>
                    </span>
                  </span>
                  <span className="hero-title-word hero-title-word-outlined">
                    <span className="hero-title-word-mask">
                      <span
                        data-hero-line="outlined"
                        className="hero-outline-text block whitespace-nowrap"
                      >
                        {hero.outlinedTitle.slice(0, -1)}
                        <span className="hero-outline-final-letter">
                          {hero.outlinedTitle.slice(-1)}
                        </span>
                      </span>
                    </span>
                  </span>
                </h1>
              </div>

              <div
                data-hero-greeting-parallax
                className="hero-meta-stage"
              >
                <div
                  data-hero-greeting
                  className="hero-lockup-meta"
                >
                  <span>{profile.role}</span>
                  <span>{profile.location}</span>
                </div>
              </div>
            </div>

            <div
              data-hero-actions-parallax
              className="hero-actions"
            >
              {hero.actions.map((action) => {
                const Icon = action.icon ? actionIcons[action.icon] : undefined;

                return (
                  <div
                    key={action.href}
                    data-hero-action
                  >
                    <FlipLink
                      href={action.href}
                      label={action.label}
                      icon={Icon}
                      variant={action.variant}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          data-hero-scroll
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2"
        >
          <svg
            data-scroll-arrow
            aria-hidden="true"
            className="h-[clamp(3.5rem,8vh,5.5rem)] w-auto text-black"
            viewBox="0 0 40 190"
            fill="none"
          >
            <line
              data-scroll-line
              x1="20"
              y1="180"
              x2="20"
              y2="30"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="origin-top [transform-box:fill-box]"
            />
            <path
              data-scroll-chevron
              d="M 6.666666666666666 166.66666666666666 L 20 180 L 33.333333333333336 166.66666666666666"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>
    </div>
  );
}
