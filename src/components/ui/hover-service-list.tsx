"use client";

import { useRef, useState, type PointerEvent } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { servicesSection, type Service } from "@/lib/data";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [pointerVisible, setPointerVisible] = useState(false);
  const reducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const followX = useSpring(pointerX, {
    stiffness: 120,
    damping: 18,
    mass: 0.7,
  });
  const followY = useSpring(pointerY, {
    stiffness: 120,
    damping: 18,
    mass: 0.7,
  });
  const horizontalVelocity = useVelocity(followX);
  const tiltTarget = useTransform(horizontalVelocity, (value) =>
    Math.max(-10, Math.min(10, value / 90))
  );
  const cardRotation = useSpring(tiltTarget, {
    stiffness: 160,
    damping: 22,
    mass: 0.5,
  });
  const activeService = services[activeIndex] ?? services[0];

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

      rows.forEach((row, index) => {
        row.setAttribute("aria-pressed", String(index === activeIndex));
      });
    },
    {
      dependencies: [activeIndex],
      scope: rootRef,
      revertOnUpdate: false,
    }
  );

  const selectService = (index: number) => {
    setActiveIndex(index);
  };

  const updatePointerPosition = (event: PointerEvent<HTMLDivElement>) => {
    if (
      reducedMotion ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      !listRef.current
    ) {
      return;
    }

    const rect = listRef.current.getBoundingClientRect();
    pointerX.set(event.clientX - rect.left);
    pointerY.set(event.clientY - rect.top);
  };

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (
      reducedMotion ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      !listRef.current
    ) {
      return;
    }

    const rect = listRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    followX.jump?.(x);
    followY.jump?.(y);
    pointerX.set(x);
    pointerY.set(y);
    setPointerVisible(true);
  };

  return (
    <div
      ref={rootRef}
      data-service-interaction
      className="grid gap-y-0 lg:grid-cols-[1.45fr_1fr] lg:gap-x-11"
    >
      <div className="col-span-full pt-3">
        <div className="flex items-baseline justify-between gap-4 pb-3">
          <span className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-black/45">
            {servicesSection.label}
          </span>
          <span className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-black/45">
            {String(services.length).padStart(2, "0")}
          </span>
        </div>
        <div
          aria-hidden="true"
          data-service-header-divider
          className="h-px bg-black/10"
        />
      </div>

      <div
        ref={listRef}
        data-service-list
        className="relative pt-2"
        onPointerMove={updatePointerPosition}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={() => setPointerVisible(false)}
      >
        <motion.div
          data-service-pointer-card
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-10 hidden will-change-transform lg:block"
          style={{ x: followX, y: followY }}
        >
          <motion.div
            className="relative -ml-[95px] -mt-[119px] h-[238px] w-[190px] overflow-hidden bg-black/10 grayscale contrast-105"
            style={{ rotate: cardRotation }}
            initial={false}
            animate={{
              scale: pointerVisible && !reducedMotion ? 1 : 0.72,
              opacity: pointerVisible && !reducedMotion ? 1 : 0,
            }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.img
                key={activeService.title}
                data-service-pointer-image
                src={activeService.image}
                alt=""
                draggable={false}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: "easeOut" }}
                className="absolute inset-0 size-full object-cover"
              />
            </AnimatePresence>
          </motion.div>
        </motion.div>

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
