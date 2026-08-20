"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { SectionReveal } from "@/components/ui/section-reveal";
import { SectionRail } from "@/components/ui/section-rail";
import { ImageReveal } from "@/components/ui/image-reveal";
import { RollingNumber } from "@/components/ui/rolling-number";
import { projects, work, type Project } from "@/lib/data";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Editorial project list: desktop cards stack at the top of the viewport,
 * shrinking the card behind them from 1 -> 0.8 as the next card arrives.
 * Images keep their independent ImageReveal effects.
 */
export function Work() {
  const rootRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const rows = Array.from(
        root.querySelectorAll<HTMLElement>("[data-work-row]"),
      );
      const media = gsap.matchMedia();

      media.add(
        "(min-width: 810px) and (prefers-reduced-motion: no-preference)",
        () => {
          rows.slice(0, -1).forEach((row, index) => {
            const nextRow = rows[index + 1];

            gsap.fromTo(
              row,
              { scale: 1 },
              {
                scale: 0.8,
                ease: "power1.inOut",
                transformOrigin: "50% 50%",
                scrollTrigger: {
                  trigger: nextRow,
                  start: "top bottom",
                  end: "top 80px",
                  scrub: 0.3,
                },
              },
            );
          });
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="work"
      aria-labelledby="work-heading"
      className="relative bg-white py-24 text-black sm:py-28 lg:py-36"
    >
      <SectionRail
        sectionRef={rootRef}
        contentRef={cardsRef}
        index={work.index}
        side="right"
      />

      <div className="mx-auto w-full max-w-[72rem] px-5 sm:px-8">
        <SectionReveal
          variant="fade"
          distance={100}
          className="mb-14 lg:mb-20"
        >
          <h2
            id="work-heading"
            className="section-heading font-heading font-semibold tracking-[-0.03em] whitespace-nowrap"
          >
            <span className="inline-block pb-[0.03em]">{work.filledTitle}</span>{" "}
            <span className="hero-outline-text inline-block pb-[0.21em] tracking-[-0.025em]">
              {work.outlinedTitle}
            </span>
          </h2>
        </SectionReveal>

        <div
          ref={cardsRef}
          data-work-cards
          className="flex flex-col gap-10 sm:gap-14 lg:gap-16"
        >
          {projects.map((project, index) => (
            <ProjectCard
              key={project.title}
              project={project}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const flipped = index % 2 === 1;
  const numeral = String(index + 1).padStart(2, "0");

  const content = (
    <>
      <ProjectFigure
        project={project}
        eager={index === 0}
      />

      <div
        data-work-info
        className="relative flex flex-1 flex-col justify-end pb-2"
      >
        <RollingNumber
          value={numeral}
          marker="work-index"
          ariaHidden
          delay={index * 0.08}
          className="hero-outline-text pointer-events-none absolute top-0 right-0 hidden font-heading text-[clamp(8.5rem,13vw,11.5rem)] leading-none font-semibold opacity-[0.06] select-none lg:block"
        />
        <div
          data-work-content
          className="relative"
        >
          <p
            data-work-meta
            className="font-sans text-[0.6875rem] tracking-[0.22em] text-black/60 uppercase"
          >
            {project.year} — {project.role}
          </p>
          <h3
            data-work-title
            className="mt-4 font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl lg:mt-6 lg:text-4xl"
          >
            {project.title}
            {project.href && (
              <ArrowUpRight
                aria-hidden="true"
                className="ml-3 inline-block size-[0.72em] translate-x-2 -translate-y-1 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100"
              />
            )}
          </h3>
          <p
            data-work-description
            className="mt-3 max-w-[34rem] text-[0.9375rem] leading-[1.6] text-black/55"
          >
            {project.description}
          </p>
          <div
            data-work-impact
            className="mt-6 grid max-w-[34rem] grid-cols-1 gap-x-10 sm:grid-cols-2 lg:mt-7"
          >
            {project.impact.map((stat) => (
              <div
                key={stat.label}
                data-impact-stat
                className="border-t border-black/10 pt-3"
              >
                <RollingNumber
                  value={stat.value}
                  marker="impact-value"
                  className="font-heading text-2xl leading-none font-semibold tracking-[-0.02em] sm:text-3xl"
                />
                <p
                  data-impact-label
                  className="mt-1.5 font-sans text-[0.6875rem] tracking-[0.22em] text-black/60 uppercase"
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const cardClass = cn(
    "work-card group relative flex w-full flex-col gap-10 bg-white pt-10 sm:pt-12 min-[810px]:sticky min-[810px]:top-20 min-[810px]:z-[1] lg:flex-row lg:gap-14 lg:pt-14",
    flipped && "lg:flex-row-reverse",
  );

  return project.href ? (
    <a
      data-work-row
      href={project.href}
      className={cardClass}
    >
      {content}
    </a>
  ) : (
    <div
      data-work-row
      className={cardClass}
    >
      {content}
    </div>
  );
}

/**
 * Project image with cinematic hover: a slow zoom and a gentle
 * mouse-following drift (desktop only), plus the scroll-scrubbed drift
 * and grayscale -> color reveal from ImageReveal. Skipped on touch devices.
 */
function ProjectFigure({
  project,
  eager = false,
}: {
  project: Project;
  eager?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const figure = ref.current;
      const img = figure?.querySelector("img");
      if (
        !figure ||
        !img ||
        !window.matchMedia(
          "(pointer: fine) and (prefers-reduced-motion: no-preference)",
        ).matches
      ) {
        return;
      }

      const xTo = gsap.quickTo(img, "x", { duration: 0.7, ease: "power3" });
      const yTo = gsap.quickTo(img, "y", { duration: 0.7, ease: "power3" });
      const onEnter = () =>
        gsap.to(img, {
          scale: 1.07,
          duration: 0.9,
          ease: "power3.out",
          overwrite: "auto",
        });
      const onLeave = () => {
        xTo(0);
        yTo(0);
        gsap.to(img, {
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          overwrite: "auto",
        });
      };
      const onMove = (event: MouseEvent) => {
        const rect = figure.getBoundingClientRect();
        xTo(((event.clientX - rect.left) / rect.width - 0.5) * 24);
        yTo(((event.clientY - rect.top) / rect.height - 0.5) * 20);
      };

      figure.addEventListener("mouseenter", onEnter);
      figure.addEventListener("mouseleave", onLeave);
      figure.addEventListener("mousemove", onMove);
      return () => {
        figure.removeEventListener("mouseenter", onEnter);
        figure.removeEventListener("mouseleave", onLeave);
        figure.removeEventListener("mousemove", onMove);
      };
    },
    { scope: ref },
  );

  return (
    <figure
      ref={ref}
      data-work-figure
      className="relative aspect-video w-full flex-1 overflow-hidden bg-white"
    >
      {project.image ? (
        <ImageReveal
          src={project.image}
          alt={`${project.title} preview`}
          className="h-full w-full"
          objectFit="contain"
          colorOnHover
          loading={eager ? "eager" : undefined}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-sans text-xs tracking-[0.32em] text-black/60 uppercase">
          {project.year}
        </span>
      )}
    </figure>
  );
}
