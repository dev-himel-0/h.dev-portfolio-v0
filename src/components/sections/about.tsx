"use client";

import { useRef } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { StaggerText } from "@/components/ui/stagger-text";
import { RollingNumber } from "@/components/ui/rolling-number";
import { about, profile, socials, stats, type SocialLink } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * About — a single cinematic 60svh frame between the hero and the work. The
 * statement is centered as a block: a single left-aligned flowing manifesto
 * paragraph, a slim odometer band that rolls into place, a typographic
 * social row with hairline separators, and a quiet credits line.
 */
export function About() {
  const rootRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const socialsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const content = root.querySelector<HTMLElement>("[data-about-content]");
      if (content) {
        gsap.fromTo(
          content,
          { yPercent: 4 },
          {
            yPercent: -4,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          },
        );
      }

      const band = statsRef.current;
      const statCells =
        band?.querySelectorAll<HTMLElement>("[data-about-stat]");
      if (band && statCells?.length) {
        ScrollTrigger.create({
          trigger: band,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.from("[data-stat-divider]", {
              scaleY: 0,
              transformOrigin: "top center",
              duration: 0.9,
              ease: "power3.out",
              stagger: 0.12,
              delay: 0.2,
            });

            gsap.from("[data-stat-label]", {
              y: 12,
              autoAlpha: 0,
              duration: 0.6,
              ease: "power2.out",
              stagger: 0.08,
              delay: 0.6,
            });
          },
        });
      }

      const socialsEl = socialsRef.current;
      if (socialsEl) {
        gsap.from("[data-social-row-inner]", {
          yPercent: 110,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.07,
          scrollTrigger: {
            trigger: socialsEl,
            start: "top 85%",
            once: true,
          },
        });
      }
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="about"
      aria-label="About"
      className="relative flex min-h-[60svh] flex-col items-center justify-center bg-white py-[clamp(1.25rem,3.5vh,2.75rem)] text-black"
    >
      <div
        data-about-content
        className="mx-auto w-full max-w-[58rem] px-5 text-center sm:px-8"
      >
        <div data-about-manifesto>
          <StaggerText
            as="p"
            divideBy="word"
            className="text-justify font-heading text-[clamp(1.375rem,2.6vw,2.25rem)] leading-[1.15] font-semibold tracking-[0.01em]"
          >
            {about.manifesto}
          </StaggerText>
        </div>

        <div
          ref={statsRef}
          data-about-stats
          className="relative mx-auto mt-[clamp(1.5rem,4vh,2.5rem)] max-w-[34rem] border-y border-black/10"
        >
          <div className="grid grid-cols-3">
            {stats.map((stat, index) => (
              <StatCell
                key={stat.label}
                stat={stat}
                index={index}
              />
            ))}
          </div>
          <span
            aria-hidden="true"
            data-stat-divider
            className="absolute inset-y-0 left-1/3 w-px bg-black/10"
          />
          <span
            aria-hidden="true"
            data-stat-divider
            className="absolute inset-y-0 left-2/3 w-px bg-black/10"
          />
        </div>

        <div
          ref={socialsRef}
          data-social-rows
          className="mt-[clamp(1.5rem,4vh,2.5rem)] flex flex-wrap items-center justify-center"
        >
          {socials.map((link, index) => (
            <SocialItem
              key={link.label}
              link={link}
              index={index}
            />
          ))}
        </div>

        <div className="mt-[clamp(1.25rem,3.5vh,2rem)] flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <span className="font-sans text-[0.625rem] tracking-[0.22em] text-black/40 uppercase">
            {profile.location}
          </span>
          <span
            aria-hidden="true"
            className="hidden size-1 rounded-full bg-black/40 sm:block"
          />
          <span className="flex items-center gap-2 font-sans text-[0.625rem] tracking-[0.22em] text-black/40 uppercase">
            <span
              aria-hidden="true"
              className="size-1 rounded-full bg-black"
            />
            {profile.availability}
          </span>
        </div>
      </div>
    </section>
  );
}

/**
 * One stat cell: a rolling odometer number that counts up when the band
 * crosses mid-viewport, a static suffix, and an uppercase label. The markup
 * renders the final digits; the RollingNumber motion rewinds and rolls.
 */
function StatCell({
  stat,
  index,
}: {
  stat: (typeof stats)[number];
  index: number;
}) {
  return (
    <div
      data-about-stat
      className="flex flex-col items-center gap-1 py-[clamp(0.875rem,2.25vh,1.375rem)] sm:gap-1.5"
    >
      <div className="flex items-baseline tabular-nums">
        <RollingNumber
          value={String(stat.value)}
          suffix={stat.suffix}
          suffixClassName="text-[0.45em] font-medium"
          delay={index * 0.15}
          className="font-heading text-[clamp(1.75rem,4.5vw,2.5rem)] leading-none font-semibold tracking-[-0.03em]"
        />
      </div>
      <span
        data-stat-label
        className="text-center font-sans text-[0.625rem] leading-snug tracking-[0.22em] text-black/50 uppercase"
      >
        {stat.label}
      </span>
    </div>
  );
}

/**
 * One typographic social link in a centered, hairline-separated row.
 * An index number precedes the label; on hover a black panel rises behind
 * it and inverts the text. Rendered as a link only when a real href
 * exists (placeholder-safe). The accessible name is the plain label.
 */
function SocialItem({ link, index }: { link: SocialLink; index: number }) {
  const inner = (
    <div
      data-social-row-inner
      className="group relative flex items-baseline gap-3 overflow-hidden px-[clamp(0.75rem,2.5vw,2rem)] py-2"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 origin-bottom scale-y-0 bg-black transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
      />
      <span
        aria-hidden="true"
        className="relative font-sans text-[0.625rem] tracking-[0.22em] text-black/40 transition-colors duration-300 group-hover:text-white/60"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="relative font-heading text-sm font-medium tracking-[0.14em] text-black uppercase transition-colors duration-300 group-hover:text-white sm:text-base">
        {link.label}
      </span>
      <ArrowUpRight
        aria-hidden="true"
        className="relative size-4 shrink-0 -translate-x-1 translate-y-1 text-black opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-white group-hover:opacity-100"
      />
    </div>
  );

  const wrapper = "relative border-l border-black/10 first:border-l-0";

  return link.href ? (
    <a
      href={link.href}
      aria-label={link.label}
      className={wrapper}
    >
      {inner}
    </a>
  ) : (
    <div className={wrapper}>{inner}</div>
  );
}
