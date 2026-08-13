"use client"

import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { SectionRail } from "@/components/ui/section-rail"
import { SectionReveal } from "@/components/ui/section-reveal"
import { HoverServiceList } from "@/components/ui/hover-service-list"
import { services, servicesSection } from "@/lib/data"

gsap.registerPlugin(ScrollTrigger, useGSAP)

export function Services() {
  const rootRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.from("[data-service-row]", {
        y: 30,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: {
          trigger: contentRef.current,
          start: "top 82%",
          once: true,
        },
      })
    },
    { scope: rootRef },
  )

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

      <div className="mx-auto w-full max-w-[72rem] px-5 sm:px-8">
        <SectionReveal variant="fade" distance={100} className="mb-14 flex justify-end lg:mb-20">
          <h2
            id="services-heading"
            className="max-w-full text-right font-heading text-[clamp(1.75rem,6.5vw,5.5rem)] leading-[0.82] font-semibold tracking-[-0.03em]"
          >
            <span className="inline-block pb-[0.03em]">{servicesSection.filledTitle}</span>{" "}
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
  )
}
