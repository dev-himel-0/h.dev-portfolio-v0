"use client";

import { useRef, useState, type PointerEvent } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Service } from "@/lib/data";
import { cn } from "@/lib/utils";

interface HoverServiceListProps {
  services: Service[];
}

/**
 * Editorial service selector adapted from the hover-testimonial reference:
 * rows drive the detail panel while a monochrome image follows the pointer on
 * fine pointers. Pointer coordinates stay outside React state so movement
 * never re-renders the section.
 */
export function HoverServiceList({ services }: HoverServiceListProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pointerCardRef = useRef<HTMLDivElement>(null);
  const pointerXRef = useRef<(value: number) => void>(() => undefined);
  const pointerYRef = useRef<(value: number) => void>(() => undefined);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pointerVisible, setPointerVisible] = useState(false);
  const activeService = services[activeIndex] ?? services[0];

  useGSAP(
    () => {
      const pointerCard = pointerCardRef.current;
      if (!pointerCard) return;

      if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !window.matchMedia("(pointer: fine)").matches
      ) {
        gsap.set(pointerCard, { autoAlpha: 0, scale: 0.72 });
        return;
      }

      pointerXRef.current = gsap.quickTo(pointerCard, "x", {
        duration: 0.65,
        ease: "power3.out",
      });
      pointerYRef.current = gsap.quickTo(pointerCard, "y", {
        duration: 0.65,
        ease: "power3.out",
      });

      return () => {
        pointerXRef.current = () => undefined;
        pointerYRef.current = () => undefined;
      };
    },
    { scope: rootRef }
  );

  useGSAP(
    () => {
      if (!rootRef.current) return;

      const rows = rootRef.current.querySelectorAll<HTMLElement>(
        "[data-service-row]"
      );
      const titles = rootRef.current.querySelectorAll<HTMLElement>(
        "[data-service-title]"
      );
      const detail = rootRef.current.querySelector<HTMLElement>(
        "[data-service-detail]"
      );
      const pointerCard = pointerCardRef.current;

      gsap.to(titles, {
        x: 0,
        duration: 0.42,
        ease: "power3.out",
        overwrite: "auto",
      });
      if (titles[activeIndex]) {
        gsap.to(titles[activeIndex], {
          x: 16,
          duration: 0.42,
          ease: "power3.out",
          overwrite: "auto",
        });
      }

      if (detail) {
        gsap.fromTo(
          detail,
          { y: 12, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.7,
            ease: "power3.out",
            overwrite: "auto",
          }
        );
      }

      if (pointerCard) {
        gsap.to(pointerCard, {
          autoAlpha: pointerVisible ? 1 : 0,
          scale: pointerVisible ? 1 : 0.72,
          duration: pointerVisible ? 0.45 : 0.3,
          ease: "power3.out",
          overwrite: "auto",
        });
      }

      rows.forEach((row, index) => {
        row.setAttribute("aria-pressed", String(index === activeIndex));
      });
    },
    {
      dependencies: [activeIndex, pointerVisible],
      scope: rootRef,
      revertOnUpdate: false,
    }
  );

  const selectService = (index: number) => {
    setActiveIndex(index);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerXRef.current || !listRef.current) return;

    const rect = listRef.current.getBoundingClientRect();
    pointerXRef.current(event.clientX - rect.left);
    pointerYRef.current(event.clientY - rect.top);
  };

  return (
    <div
      ref={rootRef}
      data-service-interaction
      className="grid gap-12 lg:grid-cols-[1.45fr_1fr] lg:gap-11"
    >
      <div
        ref={listRef}
        data-service-list
        className="relative pt-2"
        onPointerMove={handlePointerMove}
        onPointerEnter={() => setPointerVisible(true)}
        onPointerLeave={() => setPointerVisible(false)}
      >
        <div
          ref={pointerCardRef}
          data-service-pointer-card
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-10 hidden h-[clamp(11rem,17.5vw,14.875rem)] w-[clamp(8.75rem,14vw,11.875rem)] origin-center -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-black/10 grayscale lg:block"
        >
          <img
            data-service-pointer-image
            src={activeService.image}
            alt=""
            draggable={false}
            className="size-full object-cover"
          />
        </div>

        {services.map((service, index) => {
          const active = index === activeIndex;

          return (
            <div key={service.title}>
              <button
                type="button"
                data-service-row
                aria-controls="services-detail"
                aria-pressed={active}
                onClick={() => selectService(index)}
                onFocus={() => selectService(index)}
                onPointerEnter={() => selectService(index)}
                className={cn(
                  "group grid h-20 w-full grid-cols-[2.125rem_minmax(0,1fr)_auto] items-center gap-4 border-0 bg-transparent p-0 text-left outline-none lg:h-24",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-4"
                )}
              >
                <span
                  data-service-index
                  aria-hidden="true"
                  className={cn(
                    "relative inline-flex h-4 items-center font-sans text-[0.6875rem] tracking-[0.06em] text-black/40 transition-colors duration-300 motion-reduce:transition-none",
                    active && "text-black"
                  )}
                >
                  <span
                    className={cn(
                      "block size-2 bg-black opacity-0 transition-opacity duration-300 motion-reduce:transition-none",
                      active && "opacity-100"
                    )}
                  />
                  <span
                    className={cn(
                      "absolute left-0 transition-opacity duration-300 motion-reduce:transition-none",
                      active && "opacity-0"
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </span>
                <span
                  data-service-title
                  className={cn(
                    "block font-heading text-[clamp(1.45rem,3.25vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.03em] text-black transition-colors duration-300 motion-reduce:transition-none",
                    !active && "text-black/85"
                  )}
                >
                  {service.title}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap font-sans text-[0.625rem] uppercase tracking-[0.14em] text-black/40 transition-colors duration-300 motion-reduce:transition-none",
                    active && "text-black"
                  )}
                >
                  {service.tags[0]}
                </span>
              </button>
              <div aria-hidden="true" className="h-px bg-black/10" />
            </div>
          );
        })}
      </div>

      <div
        id="services-detail"
        data-service-detail-panel
        aria-live="polite"
        className="border-l border-black/10 py-6 pl-7 lg:min-h-[25rem] lg:py-8 lg:pl-11"
      >
        <div key={activeService.title} data-service-detail>
          <p className="max-w-[30rem] font-sans text-[clamp(1.05rem,1.7vw,1.5rem)] leading-[1.55] tracking-[-0.005em] text-black">
            {activeService.description}
          </p>
          <div
            aria-hidden="true"
            className="my-7 h-0.5 w-8 bg-black lg:my-8"
          />
          <p className="font-heading text-base font-medium tracking-[-0.01em] text-black">
            {activeService.title}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-sans text-[0.625rem] uppercase tracking-[0.14em] text-black/45">
            {activeService.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
