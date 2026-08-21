"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { serviceIconSources, type Service } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ImageTrail } from "@/components/ui/image-trail";
import { RollingNumber } from "@/components/ui/rolling-number";

interface HoverServiceListProps {
  services: Service[];
}

/**
 * Editorial service selector: rows drive the detail panel while the
 * capabilities list creates a contained image trail on fine pointers.
 */
export function HoverServiceList({ services }: HoverServiceListProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const activeService = services[activeIndex] ?? services[0];
  const displayedIndex = hoveredIndex ?? focusedIndex;
  const displayedCount =
    displayedIndex === null ? services.length : displayedIndex + 1;

  useGSAP(
    () => {
      if (!rootRef.current) return;

      const rows =
        rootRef.current.querySelectorAll<HTMLElement>("[data-service-row]");
      const titles = rootRef.current.querySelectorAll<HTMLElement>(
        "[data-service-title]",
      );
      const detail = rootRef.current.querySelector<HTMLElement>(
        "[data-service-detail]",
      );

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
          },
        );
      }

      rows.forEach((row, index) => {
        row.setAttribute("aria-pressed", String(index === activeIndex));
      });
    },
    {
      dependencies: [activeIndex],
      scope: rootRef,
      revertOnUpdate: false,
    },
  );

  const selectService = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div
      ref={rootRef}
      data-service-interaction
      className="grid gap-y-0 lg:grid-cols-[1.45fr_1fr] lg:gap-x-11"
    >
      <div className="col-span-full pt-3">
        <div className="flex items-baseline justify-end gap-4 pb-3">
          <RollingNumber
            value={String(displayedCount).padStart(2, "0")}
            animateOnChange
            duration={0.45}
            className="font-sans text-[0.6875rem] font-medium tracking-[0.2em] text-black/60 uppercase"
          />
        </div>
        <div
          aria-hidden="true"
          data-service-header-divider
          className="h-px bg-black/10"
        />
      </div>

      <div
        data-service-list
        className="relative pt-2"
      >
        {services.map((service, index) => {
          const active = index === activeIndex;
          const icon = serviceIconSources[service.icon];

          return (
            <div key={service.title}>
              <ImageTrail
                data-service-row-trail
                images={[
                  { src: service.image, alt: `${service.title} preview` },
                ]}
                threshold={48}
                minDelay={55}
                duration={900}
                maxItems={5}
                rotationRange={12}
                overlayClassName="hidden lg:block"
                className="relative"
              >
                <button
                  type="button"
                  data-service-row
                  aria-controls="services-detail"
                  aria-pressed={active}
                  onClick={() => selectService(index)}
                  onFocus={() => {
                    setFocusedIndex(index);
                    selectService(index);
                  }}
                  onBlur={() => setFocusedIndex(null)}
                  onPointerEnter={() => {
                    setHoveredIndex(index);
                    selectService(index);
                  }}
                  onPointerLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "group grid h-20 w-full grid-cols-[2.125rem_minmax(0,1fr)_auto] items-center gap-4 border-0 bg-transparent p-0 text-left text-[clamp(1.2rem,2.75vw,2.125rem)] leading-[1.1] outline-none max-[319px]:gap-4 max-[319px]:text-[clamp(1.05rem,6.2vw,1.25rem)] lg:h-24",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black",
                  )}
                >
                  <span
                    data-service-index
                    aria-hidden="true"
                    className={cn(
                      "relative inline-flex h-4 items-center font-sans text-[0.6875rem] tracking-[0.06em] text-black/60 transition-colors duration-300",
                      active && "text-black",
                    )}
                  >
                    <span
                      className={cn(
                        "block size-2 bg-black opacity-0 transition-opacity duration-300",
                        active && "opacity-100",
                      )}
                    />
                    <span
                      className={cn(
                        "absolute left-0 transition-opacity duration-300",
                        active && "opacity-0",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span
                    data-service-title
                    className={cn(
                      "block min-w-0 font-heading font-medium tracking-[-0.03em] text-black transition-colors duration-300",
                      !active && "text-black/85",
                    )}
                  >
                    {service.title}
                  </span>
                  <span
                    data-service-icon-frame
                    aria-hidden="true"
                    className={cn(
                      "flex size-[1em] shrink-0 items-center justify-end text-black/40 transition-colors duration-300",
                      active && "text-black",
                    )}
                  >
                    <Image
                      data-service-icon
                      data-image-source={icon.src}
                      src={icon.src}
                      alt={icon.alt}
                      width={40}
                      height={40}
                      draggable={false}
                      className="size-full origin-right -translate-x-[0.125em] scale-[1.3] object-contain"
                    />
                  </span>
                </button>
              </ImageTrail>
              <div
                aria-hidden="true"
                className="h-px bg-black/10"
              />
            </div>
          );
        })}
      </div>

      <div
        id="services-detail"
        data-service-detail-panel
        aria-live="polite"
        className="border-t border-l-0 border-black/10 px-0 py-6 lg:min-h-[25rem] lg:border-t-0 lg:border-l lg:py-8 lg:pl-11"
      >
        <div
          key={activeService.title}
          data-service-detail
        >
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
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-sans text-[0.6875rem] tracking-[0.14em] text-black/60 uppercase">
            {activeService.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
