"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionRail } from "@/components/ui/section-rail";
import { SectionReveal } from "@/components/ui/section-reveal";
import { HoverServiceList } from "@/components/ui/hover-service-list";
import { services, servicesSection } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Services() {
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

      const rows = Array.from(
        content.querySelectorAll<HTMLElement>("[data-service-row]"),
      );

      gsap.from(rows, {
        y: 30,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.06,
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
      id="services"
      aria-labelledby="services-heading"
      className="relative bg-white py-24 text-black sm:py-28 lg:py-36"
    >
      <SectionRail
        sectionRef={rootRef}
        contentRef={contentRef}
        index={servicesSection.index}
        side="left"
      />

      <div className="page-container">
        <SectionReveal
          variant="fade"
          distance={48}
          className="mb-14 flex justify-end lg:mb-20"
        >
          <h2
            id="services-heading"
            className="section-heading max-w-full text-right font-heading font-semibold tracking-[-0.03em]"
          >
            <span className="inline-block pb-[0.03em]">
              {servicesSection.filledTitle}
            </span>{" "}
            <span className="hero-outline-text inline-block pb-[0.21em] tracking-[-0.025em]">
              {servicesSection.outlinedTitle}
            </span>
          </h2>
        </SectionReveal>

        <div ref={contentRef}>
          <HoverServiceList services={services} />
        </div>
      </div>
    </section>
  );
}
