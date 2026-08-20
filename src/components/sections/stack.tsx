"use client";

import { MagicBentoCell, MagicBentoGrid } from "@/components/ui/magic-bento";
import { MaskedAvatars } from "@/components/ui/masked-avatars";
import { SectionRail } from "@/components/ui/section-rail";
import { SectionReveal } from "@/components/ui/section-reveal";
import {
  stackCapabilities,
  stackSection,
  type StackCapability,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  SiFigma,
  SiFramer,
  SiGooglechrome,
  SiGsap,
  SiLighthouse,
  SiNextdotjs,
  SiNodedotjs,
  SiReact,
  SiStorybook,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
} from "react-icons/si";
import {
  TbApi,
  TbBolt,
  TbComponents,
  TbGauge,
  TbPlugConnected,
  TbRobot,
  TbWaveSine,
} from "react-icons/tb";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const toolIcons: Record<string, IconType> = {
  React: SiReact,
  "Next.js": SiNextdotjs,
  TypeScript: SiTypescript,
  "Node.js": SiNodedotjs,
  Figma: SiFigma,
  Tailwind: SiTailwindcss,
  "Tailwind CSS": SiTailwindcss,
  Storybook: SiStorybook,
  "Design Systems": TbComponents,
  GSAP: SiGsap,
  Motion: SiFramer,
  Lenis: TbWaveSine,
  Lighthouse: SiLighthouse,
  "Chrome DevTools": SiGooglechrome,
  Vercel: SiVercel,
  "Core Web Vitals": TbGauge,
  "AI Workflows": TbRobot,
  APIs: TbApi,
  Automation: TbBolt,
  Integrations: TbPlugConnected,
};

const ghostIconByCapability: Record<string, IconType> = {
  "Landing Page Design": SiReact,
  "Website Design / Redesign": SiTailwindcss,
  "Web / App Development": SiNodedotjs,
  "AI Automation": TbBolt,
};

const iconPositionStyle = {
  "--ghost-size": "clamp(7rem, 12vw, 11rem)",
  top: "calc(var(--ghost-size) * -0.2)",
  right: "calc(var(--ghost-size) * -0.2)",
  fontSize: "var(--ghost-size)",
} as CSSProperties;

export function Stack() {
  const rootRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const root = rootRef.current;
      const content = contentRef.current;
      if (!root || !content) return;

      const cells = Array.from(
        content.querySelectorAll<HTMLElement>("[data-bento-cell]"),
      );

      gsap.from(cells, {
        y: 34,
        autoAlpha: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: contentRef.current,
          start: "top 82%",
          onEnter: (self) =>
            requestAnimationFrame(() => self.kill(false, true)),
        },
      });
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="stack"
      aria-labelledby="stack-heading"
      className="relative bg-white py-24 text-black sm:py-28 lg:py-36"
    >
      <SectionRail
        sectionRef={rootRef}
        contentRef={contentRef}
        index={stackSection.index}
        side="right"
      />

      <div className="mx-auto w-full max-w-[72rem] px-5 sm:px-8">
        <SectionReveal
          variant="fade"
          distance={100}
          className="mb-14 lg:mb-20"
        >
          <h2
            id="stack-heading"
            className="section-heading font-heading font-semibold tracking-[-0.03em]"
          >
            <span className="inline-block pb-[0.03em]">
              {stackSection.filledTitle}
            </span>{" "}
            <span className="hero-outline-text inline-block pb-[0.21em] tracking-[-0.025em]">
              {stackSection.outlinedTitle}
            </span>
          </h2>
        </SectionReveal>

        <div
          ref={contentRef}
          data-stack-grid-wrapper
        >
          <MagicBentoGrid className="border-t border-l border-black/10 md:grid-cols-12">
            {stackCapabilities.map((capability, index) => (
              <CapabilityCell
                key={capability.title}
                capability={capability}
                index={index}
              />
            ))}
          </MagicBentoGrid>
        </div>
      </div>
    </section>
  );
}

function CapabilityCell({
  capability,
  index,
}: {
  capability: StackCapability;
  index: number;
}) {
  const items = capability.tools.map((name) => ({
    name,
    icon: toolIcons[name],
  }));

  const GhostIcon = ghostIconByCapability[capability.title];

  const [hovered, setHovered] = useState(false);

  const cellWidth =
    index === 0 || index === 3 ? "md:col-span-7" : "md:col-span-5";
  const isWide = index === 0 || index === 3;

  return (
    <MagicBentoCell className={cellWidth}>
      <article
        data-stack-card
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        className="relative flex h-full min-h-[14rem] flex-col px-4 py-4 sm:min-h-[14.5rem] sm:px-5 sm:py-5 lg:min-h-[15rem] lg:px-8 lg:py-5"
      >
        <motion.span
          aria-hidden="true"
          data-stack-icon
          className="pointer-events-none absolute z-0 text-black/[0.03] select-none"
          style={iconPositionStyle}
          initial={false}
          animate={{
            x: hovered ? "-20%" : "0%",
            y: hovered ? "20%" : "0%",
          }}
          transition={{ type: "spring", stiffness: 80, damping: 17, mass: 0.9 }}
        >
          {GhostIcon ? <GhostIcon /> : null}
        </motion.span>

        <div className="relative z-[1] mr-auto flex h-full w-full max-w-[27rem] min-w-0 flex-col pb-1 text-left">
          <h3
            data-stack-title
            className={cn(
              "min-w-0 font-heading font-medium tracking-[-0.035em] [text-wrap:nowrap] whitespace-nowrap",
              isWide
                ? "max-w-[19rem] text-[clamp(1.15rem,2.4vw,2.1rem)]/[0.98]"
                : "max-w-none text-[clamp(1.1rem,1.8vw,1.75rem)]/[0.98]",
            )}
          >
            {capability.title}
          </h3>
          <p
            data-stack-description
            className="mt-5 line-clamp-3 min-h-[4.1rem] max-w-none text-[0.9375rem] leading-[1.55] tracking-[-0.005em] text-black/55"
          >
            {capability.description}
          </p>
          <div
            className="mt-auto pt-0"
            data-stack-tools
          >
            <MaskedAvatars
              items={items}
              size={42}
              overlap={14}
              aria-label={`${capability.title} tools: ${capability.tools.join(", ")}`}
            />
            <span className="sr-only">{capability.tools.join(", ")}</span>
          </div>
        </div>
      </article>
    </MagicBentoCell>
  );
}
