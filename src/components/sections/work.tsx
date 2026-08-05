"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import {
  SiGsap,
  SiJavascript,
  SiNextdotjs,
  SiNodedotjs,
  SiNuxt,
  SiReact,
  SiRedux,
  SiSass,
  SiStyledcomponents,
  SiTailwindcss,
  SiTypescript,
  SiVuedotjs,
  SiWebflow,
} from "react-icons/si";
import { SectionReveal } from "@/components/ui/section-reveal";
import { SectionRail } from "@/components/ui/section-rail";
import { ImageReveal } from "@/components/ui/image-reveal";
import { MaskedAvatars } from "@/components/ui/masked-avatars";
import { projects, work, type Project } from "@/lib/data";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const technologyIcons = {
  GSAP: SiGsap,
  JavaScript: SiJavascript,
  "Next.js": SiNextdotjs,
  "Node.js": SiNodedotjs,
  Nuxt: SiNuxt,
  React: SiReact,
  Redux: SiRedux,
  SCSS: SiSass,
  "Styled Components": SiStyledcomponents,
  "Tailwind CSS": SiTailwindcss,
  TypeScript: SiTypescript,
  Vue: SiVuedotjs,
  Webflow: SiWebflow,
};

/**
 * Editorial project list: each card sticks at the top of the viewport while
 * the next card scrolls up over it, and each row fades up from below as it
 * enters. Images wipe open through the ImageReveal clip. Skipped under
 * `prefers-reduced-motion`.
 */
export function Work() {
  const rootRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.utils.toArray<HTMLElement>("[data-work-row]").forEach((row) => {
        gsap.from(row, {
          y: 100,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: row, start: "top 88%", once: true },
        });
      });
    },
    { scope: rootRef }
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
        <SectionReveal variant="fade" distance={100} className="mb-14 lg:mb-20">
          <h2
            id="work-heading"
            className="whitespace-nowrap font-heading text-[clamp(1.75rem,6.5vw,5.5rem)] font-semibold leading-[0.82] tracking-[-0.03em]"
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
      <ProjectFigure project={project} eager={index === 0} />

      <div
        data-work-info
        className="relative flex flex-1 flex-col justify-end pb-2"
      >
        <span
          aria-hidden="true"
          data-work-index
          className="hero-outline-text pointer-events-none absolute right-0 top-0 hidden select-none font-heading text-[clamp(8.5rem,13vw,11.5rem)] font-semibold leading-none opacity-[0.06] lg:block"
        >
          {numeral}
        </span>
        <div data-work-content className="relative">
          <p
            data-work-meta
            className="font-sans text-[0.625rem] uppercase tracking-[0.22em] text-black/50"
          >
            {project.year} — {project.role}
          </p>
          <h3
            data-work-title
            className="mt-4 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl lg:mt-6 lg:text-4xl"
          >
            {project.title}
            {project.href && (
              <ArrowUpRight
                aria-hidden="true"
                className="ml-3 inline-block size-[0.72em] -translate-y-1 translate-x-2 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100"
              />
            )}
          </h3>
          <p
            data-work-description
            className="mt-3 max-w-[34rem] text-sm leading-relaxed text-black/55"
          >
            {project.description}
          </p>
          <div data-work-stack className="mt-5">
            <MaskedAvatars
              items={project.stack.map((name) => ({
                name,
                icon: technologyIcons[name as keyof typeof technologyIcons],
              }))}
              aria-label={`${project.title} technology stack`}
            />
          </div>
        </div>
      </div>
    </>
  );

  const cardClass = cn(
    "work-card group sticky top-20 flex w-full flex-col gap-10 bg-white pt-10 sm:pt-12 lg:flex-row lg:gap-14 lg:pt-14",
    flipped && "lg:flex-row-reverse"
  );

  return project.href ? (
    <a data-work-row href={project.href} className={cardClass}>
      {content}
    </a>
  ) : (
    <div data-work-row className={cardClass}>
      {content}
    </div>
  );
}

/**
 * Project image with cinematic hover: a slow zoom and a gentle
 * mouse-following drift (desktop only), plus the scroll-scrubbed drift
 * and grayscale -> color reveal from ImageReveal. Skipped under
 * `prefers-reduced-motion` and on touch devices.
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
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !window.matchMedia("(pointer: fine)").matches
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
    { scope: ref }
  );

  return (
    <figure
      ref={ref}
      data-work-figure
      className="relative aspect-[1.56] w-full flex-1 overflow-hidden bg-black/[0.04] lg:aspect-[1.529]"
    >
      {project.image ? (
        <ImageReveal
          src={project.image}
          alt={`${project.title} preview`}
          className="h-full w-full"
          parallax={16}
          colorOnHover
          loading={eager ? "eager" : undefined}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-sans text-xs uppercase tracking-[0.32em] text-black/40">
          {project.year}
        </span>
      )}
    </figure>
  );
}