"use client";

import { useRef } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Navbar } from "@/components/sections/navbar";
import { FlipLink } from "@/components/ui/flip-link";
import { hero } from "@/lib/data";

gsap.registerPlugin(useGSAP);

const actionIcons = {
  "arrow-up-right": ArrowUpRight,
};

export function Hero({ isRevealed }: { isRevealed: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!isRevealed) return;

      const media = gsap.matchMedia();

      media.add(
        { reduceMotion: "(prefers-reduced-motion: reduce)" },
        (context) => {
          const targets = [
            "[data-hero-nav]",
            "[data-hero-rail]",
            "[data-hero-line]",
            "[data-hero-action]",
            "[data-hero-scroll]",
          ];

          if (context.conditions?.reduceMotion) {
            gsap.set(targets, { clearProps: "all" });
            return;
          }

          gsap.set("[data-hero-line]", {
            willChange: "transform",
            transformPerspective: 1000,
          });
          gsap.set("[data-hero-action]", { willChange: "transform,opacity" });

          const timeline = gsap.timeline({
            delay: 0.35,
            defaults: { ease: "power4.out" },
            onComplete: () => {
              gsap.set(["[data-hero-line]", "[data-hero-action]"], {
                clearProps: "willChange",
              });
            },
          });

          timeline
            .from(
              "[data-hero-nav]",
              { y: -22, autoAlpha: 0, duration: 0.75 },
              0
            )
            .from(
              "[data-hero-rail]",
              { x: -14, autoAlpha: 0, duration: 0.72 },
              0.04
            )
            .from(
              "[data-hero-rail-line]",
              { scaleY: 0, transformOrigin: "top center", duration: 0.8 },
              0.12
            )
            .from(
              "[data-hero-line='filled']",
              { yPercent: 112, rotateX: -7, duration: 1.15 },
              0.25
            )
            .from(
              "[data-hero-line='outlined']",
              { yPercent: 112, rotateX: -7, duration: 1.15 },
              0.39
            )
            .from(
              "[data-hero-action]",
              { y: 30, autoAlpha: 0, duration: 0.72, stagger: 0.1 },
              0.83
            )
            .from(
              "[data-hero-scroll]",
              { y: 12, autoAlpha: 0, duration: 0.6 },
              1.02
            )
            .from(
              "[data-hero-scroll-line]",
              { scaleY: 0, transformOrigin: "top center", duration: 0.62 },
              1.08
            );

          const arrowTween = gsap.to("[data-scroll-arrow]", {
            y: 5,
            duration: 1.15,
            delay: 2.1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });

          const handleVisibility = () => {
            if (document.hidden) arrowTween.pause();
            else arrowTween.resume();
          };

          document.addEventListener("visibilitychange", handleVisibility);
          handleVisibility();

          return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
          };
        }
      );

      return () => media.revert();
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
      className="relative min-h-[100svh] w-full max-w-full overflow-hidden bg-white font-general text-black"
    >
      <Navbar />

      <section
        id="home"
        aria-labelledby="hero-heading"
        className="relative flex min-h-[100svh] items-center justify-center px-5 pb-28 pt-24 sm:px-8 sm:pb-32 lg:px-24"
      >
        <div
          data-hero-rail
          aria-hidden="true"
          className="absolute left-[clamp(2.25rem,2.65vw,2.75rem)] top-[40.5%] hidden flex-col items-center gap-4 lg:flex"
        >
          <span className="size-1.5 rounded-full bg-black" />
          <span
            data-hero-rail-line
            className="h-14 w-px origin-top bg-black/50"
          />
          <span className="text-[0.625rem] font-medium uppercase tracking-[0.22em] text-black/60 [writing-mode:vertical-rl]">
            01
          </span>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[75rem] -translate-y-[0.6vh] flex-col items-center">
          <h1
            id="hero-heading"
            className="w-full text-center text-[clamp(3.25rem,15vw,7.25rem)] font-semibold leading-[0.82] tracking-[-0.03em] lg:text-[clamp(7.25rem,11.5vw,11.75rem)]"
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
          className="absolute bottom-[clamp(2.25rem,3.5vh,3rem)] left-1/2 flex -translate-x-1/2 flex-col items-center"
        >
          <span className="text-[0.625rem] font-medium uppercase tracking-[0.32em]">
            SCROLL
          </span>
          <span
            data-hero-scroll-line
            className="mt-3 h-11 w-px origin-top bg-black/60"
          />
          <svg
            data-scroll-arrow
            aria-hidden="true"
            className="-mt-0.5 size-3.5 text-black"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 4l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>
    </div>
  );
}
