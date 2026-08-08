"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FuzzyText } from "@/components/ui/fuzzy-text";
import { FlipLink } from "@/components/ui/flip-link";
import { notFound, profile } from "@/lib/data";

gsap.registerPlugin(useGSAP);

const GLITCH_INTERVAL = 2600;
const GLITCH_DURATION = 220;

export default function NotFound() {
  const rootRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const timeline = gsap.timeline({ defaults: { ease: "power4.out" } });
      timeline
        .from("[data-nf-top]", { y: -12, autoAlpha: 0, duration: 0.6 }, 0.05)
        .from(
          "[data-nf-status]",
          { autoAlpha: 0, scale: 0.985, duration: 1.2, ease: "expo.out" },
          0.2
        )
        .from(
          "[data-nf-message]",
          { autoAlpha: 0, y: 26, duration: 1, ease: "expo.out" },
          0.95
        )
        .from(
          "[data-nf-action]",
          { autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.12 },
          1.3
        )
        .from("[data-nf-bottom]", { autoAlpha: 0, duration: 0.6 }, 1.5);
    },
    { scope: rootRef }
  );

  return (
    <main ref={rootRef} className="relative flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 px-[clamp(1.5rem,6vw,4.5rem)] pt-[clamp(1.5rem,4vh,2.75rem)]">
        <p
          data-nf-top
          className="text-[0.625rem] font-semibold uppercase leading-none tracking-[0.22em] text-black/45"
        >
          {profile.name} — {profile.role}
        </p>
        <p
          data-nf-top
          className="text-[0.625rem] font-semibold uppercase leading-none tracking-[0.22em] text-black/45"
        >
          Error {notFound.status}
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-[clamp(2rem,6vh,3.5rem)] px-6 py-[clamp(2rem,6vh,4rem)] text-center">
        <h1 className="sr-only">
          {notFound.status} — {notFound.label}
        </h1>
        <div data-nf-status className="font-heading leading-none">
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
        </div>
        <div data-nf-message className="font-heading">
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
        </div>
        <div
          data-nf-action
          className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row"
        >
          {notFound.actions.map((action, index) => (
            <FlipLink
              key={action.label}
              href={action.href}
              label={action.label}
              variant={index === 0 ? "solid" : "outline"}
            />
          ))}
        </div>
      </div>

      <footer className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 px-[clamp(1.5rem,6vw,4.5rem)] pb-[clamp(1.5rem,4vh,2.75rem)]">
        <p
          data-nf-bottom
          className="text-[0.625rem] font-semibold uppercase leading-none tracking-[0.22em] text-black/45"
        >
          {profile.location}
        </p>
        <p
          data-nf-bottom
          className="max-w-full truncate text-right text-[0.625rem] font-semibold uppercase leading-none tracking-[0.22em] text-black/45"
        >
          {pathname || notFound.label}
        </p>
      </footer>
    </main>
  );
}
