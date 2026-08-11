"use client";

import { useRef } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Navbar } from "@/components/sections/navbar";
import { FlipLink } from "@/components/ui/flip-link";
import { hero } from "@/lib/data";

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

      gsap.set("[data-hero-line]", { willChange: "transform" });
      gsap.set(
        ["[data-hero-rail-content]", "[data-hero-rail-line]", "[data-scroll-arrow]"],
        { willChange: "transform" }
      );
      gsap.set("[data-hero-action]", { willChange: "transform,opacity" });
      gsap.set("[data-scroll-line]", {
        scaleY: 0,
        transformOrigin: "50% 0%",
        transformBox: "fill-box",
        willChange: "transform",
      });
      gsap.set("[data-scroll-chevron]", {
        autoAlpha: 0,
        willChange: "transform,opacity",
      });

      const timeline = gsap.timeline({
        delay: entranceDelay,
        defaults: { ease: "power4.out" },
        onComplete: () => {
          gsap.set(
            [
              "[data-hero-line]",
              "[data-hero-rail-content]",
              "[data-hero-rail-line]",
              "[data-scroll-arrow]",
              "[data-scroll-line]",
              "[data-scroll-chevron]",
              "[data-hero-action]",
            ],
            { clearProps: "willChange" }
          );
        },
      });

      timeline
        .from("[data-hero-greeting]", { y: 10, autoAlpha: 0, duration: 0.55 }, 0.1)
        .from("[data-hero-mono]", { y: -12, autoAlpha: 0, duration: 0.55 }, 0.1)
        .from(
          "[data-hero-menu-toggle]",
          { y: -10, autoAlpha: 0, duration: 0.5 },
          0.22
        )
        .from(
          "[data-hero-rail-content]",
          { y: 10, autoAlpha: 0, duration: 0.5, ease: "power3.out" },
          0.18
        )
        .from(
          "[data-hero-rail-line]",
          { scaleY: 0, transformOrigin: "top center", duration: 0.7, ease: "power3.out" },
          0.26
        )
        .from(
          "[data-hero-line='filled']",
          { yPercent: 110, autoAlpha: 0, duration: 1, ease: "expo.out" },
          0.34
        )
        .from(
          "[data-hero-line='outlined']",
          { yPercent: 110, autoAlpha: 0, duration: 1.05, ease: "expo.out" },
          0.48
        )
        .from(
          "[data-hero-action]",
          { y: 18, autoAlpha: 0, duration: 0.7, stagger: 0.1 },
          1.0
        )
        .to(
          "[data-scroll-line]",
          { scaleY: 1, duration: 0.9, ease: "power3.inOut" },
          1.3
        )
        .to(
          "[data-scroll-chevron]",
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
          1.8
        );

      gsap.to("[data-scroll-arrow]", {
        y: -10,
        duration: 1.1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: ENTRANCE_DELAY_S + 2.15,
      });

      gsap.fromTo(
        "[data-hero-scroll]",
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -64,
          ease: "power3.inOut",
          scrollTrigger: {
            start: 0,
            end: () =>
              Math.max(
                1,
                rootRef.current?.offsetHeight ?? window.innerHeight
              ),
            scrub: 0.6,
          },
        }
      );
    },
    {
      scope: rootRef,
      dependencies: [isRevealed],
      revertOnUpdate: true,
    }
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
        className="hero-section relative flex min-h-[100svh] items-center justify-center"
      >
        <div
          aria-hidden="true"
          className="absolute left-[clamp(2.25rem,2.65vw,2.75rem)] top-[40.5%] hidden justify-center lg:flex"
        >
          <div className="overflow-hidden">
            <div
              data-hero-rail-content
              className="flex flex-col items-center gap-4 will-change-transform"
            >
              <span
                data-hero-rail-dot
                className="size-1.5 bg-black"
              />
              <span
                data-hero-rail-line
                className="h-14 w-px origin-top bg-black/50"
              />
              <span
                data-hero-rail-label
                className="text-[0.625rem] font-medium uppercase tracking-[0.22em] text-black/60 [writing-mode:vertical-rl]"
              >
                01
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[75rem] -translate-y-[0.6vh] flex-col items-center">
          <p
            data-hero-greeting
            className="mb-[clamp(0.75rem,2.5vh,1.5rem)] text-[1.0625rem] font-normal tracking-[0.18em] text-black/70"
          >
            Hi there, I am <strong className="font-medium text-[1.125rem]">Himel</strong>
          </p>

          <h1
            id="hero-heading"
            className="hero-title w-full text-center text-[clamp(2.625rem,14.5vw,7.25rem)] font-semibold leading-[0.82] tracking-[-0.03em] lg:text-[clamp(7.25rem,11.5vw,11.75rem)]"
          >
            <span className="block overflow-hidden pb-[0.03em]">
              <span
                data-hero-line="filled"
                className="block whitespace-nowrap"
              >
                {hero.filledTitle}
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.21em]">
              <span
                data-hero-line="outlined"
                className="hero-outline-text block whitespace-nowrap tracking-[-0.025em]"
              >
                {hero.outlinedTitle}
              </span>
            </span>
          </h1>

          <div className="mt-[clamp(2rem,5.5vh,3.25rem)] flex w-full max-w-[18rem] flex-col items-stretch justify-center gap-4 sm:max-w-none sm:flex-row sm:items-center sm:gap-6">
            {hero.actions.map((action) => {
              const Icon = action.icon ? actionIcons[action.icon] : undefined;

              return (
                <div key={action.href} data-hero-action>
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
