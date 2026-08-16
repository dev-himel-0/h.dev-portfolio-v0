"use client";

import { SectionRail } from "@/components/ui/section-rail";
import { SectionReveal } from "@/components/ui/section-reveal";
import { VideoReveal } from "@/components/ui/video-reveal";
import { processSection, processSteps, serviceIconSources } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function HowIWork() {
  const rootRef = useRef<HTMLElement>(null);
  const flowRef = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const flow = flowRef.current;
      if (!flow) return;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const isMobile = !window.matchMedia("(min-width: 810px)").matches;

      const steps = gsap.utils.toArray<HTMLElement>("[data-process-step]");
      const cleanups: Array<() => void> = [];

      steps.forEach((step, index) => {
        const media = step.querySelector<HTMLElement>("[data-process-media]");
        const visuals = gsap.utils.toArray<HTMLElement>(
          media?.querySelectorAll("img, [data-process-visual]") ?? [],
        );
        const copy = gsap.utils.toArray<HTMLElement>(
          step.querySelectorAll("[data-process-copy]"),
        );
        const numberStrip = step.querySelector<HTMLElement>(
          "[data-process-number-strip]",
        );
        const verticalFills = gsap.utils.toArray<HTMLElement>(
          step.querySelectorAll(
            "[data-process-vertical-fill], [data-process-mobile-fill]",
          ),
        );
        const horizontalFill = step.querySelector<HTMLElement>(
          "[data-process-horizontal-fill]",
        );
        const nodes = gsap.utils.toArray<HTMLElement>(
          step.querySelectorAll("[data-process-node-fill]"),
        );

        if (!media || !numberStrip || !verticalFills.length) {
          return;
        }

        const finalNumber = -((index + 1) * 10);
        const setVerticalFill = gsap.quickSetter(verticalFills, "scaleY");
        const setHorizontalFill = horizontalFill
          ? gsap.quickSetter(horizontalFill, "scaleX")
          : undefined;
        const setNumberPosition = gsap.quickSetter(numberStrip, "yPercent");
        const applyProgress = (progress: number) => {
          const value = gsap.utils.clamp(0, 1, progress);
          setVerticalFill(value);
          setHorizontalFill?.(value);
          setNumberPosition(finalNumber * value);
          const scale = 0.7 + value * 0.3;
          nodes.forEach((node) => {
            node.style.opacity = String(value);
            node.style.transform = `scale(${scale})`;
            node.style.visibility = value > 0 ? "visible" : "hidden";
          });
        };

        if (reducedMotion) {
          gsap.set(media, { autoAlpha: 1, y: 0 });
          gsap.set(copy, { autoAlpha: 1, y: 0 });
          gsap.set(verticalFills, { scaleY: 1 });
          setHorizontalFill?.(1);
          setNumberPosition(finalNumber);
          gsap.set(nodes, { autoAlpha: 1, scale: 1 });
          return;
        }

        // Touch scrolling should not drive a progress animation on every
        // scroll event. Keep a lightweight once-only reveal on phones.
        if (isMobile) {
          gsap.set(verticalFills, { scaleY: 1 });
          setNumberPosition(finalNumber);
          gsap.set(nodes, { autoAlpha: 1, scale: 1 });
          gsap.fromTo(
            media,
            { autoAlpha: 0, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.65,
              ease: "power3.out",
              scrollTrigger: { trigger: step, start: "top 84%", once: true },
            },
          );
          gsap.fromTo(
            copy,
            { autoAlpha: 0, y: 16 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.55,
              ease: "power3.out",
              stagger: 0.05,
              scrollTrigger: { trigger: step, start: "top 84%", once: true },
            },
          );
          return;
        }

        gsap.set(media, { autoAlpha: 0, y: 40 });
        gsap.set(copy, { autoAlpha: 0, y: 20 });
        gsap.set(numberStrip, { yPercent: 0 });
        gsap.set(verticalFills, {
          scaleY: 0,
          transformOrigin: "top center",
        });
        if (horizontalFill) {
          gsap.set(horizontalFill, {
            scaleX: 0,
            transformOrigin: index % 2 === 0 ? "left center" : "right center",
          });
        }
        gsap.set(nodes, { autoAlpha: 0, scale: 0.7 });

        const trigger = ScrollTrigger.create({
          trigger: step,
          start: "top 78%",
          end: "bottom 42%",
          onUpdate: (self) => applyProgress(self.progress),
          onEnter: () => {
            const timeline = gsap.timeline({
              defaults: { ease: "power3.out" },
            });

            timeline
              .to(media, { autoAlpha: 1, y: 0, duration: 0.85 }, 0)
              .to(
                copy,
                { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06 },
                0.1,
              );
          },
        });

        trigger.update();

        if (visuals.length && window.matchMedia("(pointer: fine)").matches) {
          const xTo = gsap.quickTo(visuals, "x", {
            duration: 0.7,
            ease: "power3",
          });
          const yTo = gsap.quickTo(visuals, "y", {
            duration: 0.7,
            ease: "power3",
          });
          const onEnter = () =>
            gsap.to(visuals, {
              scale: 1.07,
              duration: 0.9,
              ease: "power3.out",
              overwrite: "auto",
            });
          const onLeave = () => {
            xTo(0);
            yTo(0);
            gsap.to(visuals, {
              scale: 1,
              duration: 0.9,
              ease: "power3.out",
              overwrite: "auto",
            });
          };
          const onMove = (event: MouseEvent) => {
            const rect = media.getBoundingClientRect();
            xTo(((event.clientX - rect.left) / rect.width - 0.5) * 24);
            yTo(((event.clientY - rect.top) / rect.height - 0.5) * 20);
          };

          media.addEventListener("mouseenter", onEnter);
          media.addEventListener("mouseleave", onLeave);
          media.addEventListener("mousemove", onMove);
          cleanups.push(() => {
            media.removeEventListener("mouseenter", onEnter);
            media.removeEventListener("mouseleave", onLeave);
            media.removeEventListener("mousemove", onMove);
          });
        }
      });

      return () => cleanups.forEach((cleanup) => cleanup());
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="how-i-work"
      aria-labelledby="how-i-work-heading"
      className="relative overflow-clip bg-white py-[6.25rem] text-black sm:py-[7.5rem] lg:py-[8.75rem]"
    >
      <SectionRail
        sectionRef={rootRef}
        contentRef={flowRef}
        index={processSection.index}
        side="left"
      />

      <div className="mx-auto w-full max-w-[75rem] px-[1.875rem]">
        <SectionReveal
          variant="fade"
          distance={100}
        >
          <header
            data-reveal
            data-process-heading
            className="mb-[3.75rem] flex w-full flex-col items-end gap-7 text-right sm:mb-[5rem] lg:mb-[6.25rem]"
          >
            <span
              data-process-label
              className="sr-only"
            >
              {processSection.index} / PROCESS
            </span>
            <h2
              id="how-i-work-heading"
              className="font-heading text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.88] font-semibold tracking-[-0.045em] whitespace-nowrap"
            >
              <span className="inline-block pb-[0.03em]">
                {processSection.filledTitle}
              </span>{" "}
              <span className="hero-outline-text inline-block pb-[0.2em] tracking-[-0.035em]">
                {processSection.outlinedTitle}
              </span>
            </h2>
          </header>
        </SectionReveal>

        <ol
          ref={flowRef}
          data-process-flow
          className="relative max-[809px]:pr-0 max-[809px]:pl-5"
        >
          <span
            aria-hidden="true"
            data-process-mobile-track
            className="pointer-events-none absolute top-0 bottom-0 left-[-0.5rem] w-1 bg-black/10 min-[810px]:hidden"
          />

          {processSteps.map((step, index) => (
            <ProcessStep
              key={step.title}
              step={step}
              index={index}
              last={index === processSteps.length - 1}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProcessStep({
  step,
  index,
  last,
}: {
  step: (typeof processSteps)[number];
  index: number;
  last: boolean;
}) {
  const railOnLeft = index % 2 === 0;
  const number = String(index + 1).padStart(2, "0");
  const icon = serviceIconSources[step.icon];

  return (
    <li
      data-process-step
      className={cn(
        "group relative max-[809px]:py-6 min-[810px]:grid min-[810px]:grid-cols-2 min-[810px]:items-center min-[810px]:gap-x-20 min-[810px]:py-[3.125rem] min-[810px]:pb-[3.75rem]",
        last && "min-[810px]:pb-[3.125rem]",
      )}
    >
      <div
        aria-hidden="true"
        data-process-desktop-track
        className={cn(
          "pointer-events-none absolute top-0 bottom-0 hidden w-1.5 bg-black/10 min-[810px]:block",
          railOnLeft ? "left-0" : "left-1/2 -translate-x-1/2",
          index === 0 && "top-[0.9375rem]",
        )}
      >
        <span
          data-process-vertical-fill
          className="absolute inset-x-0 top-0 bottom-0 origin-top scale-y-0 bg-black"
        />
      </div>

      {!last && (
        <div
          aria-hidden="true"
          data-process-horizontal-track
          className={cn(
            "pointer-events-none absolute bottom-0 hidden h-1.5 w-1/2 bg-black/10 min-[810px]:block",
            railOnLeft ? "left-0" : "right-1/2",
          )}
        >
          <span
            data-process-horizontal-fill
            className={cn(
              "absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-black",
              !railOnLeft && "origin-right",
            )}
          />
        </div>
      )}

      <span
        aria-hidden="true"
        data-process-node
        className={cn(
          "pointer-events-none absolute z-[2] hidden size-8 rounded-full border-[0.3125rem] border-black/10 bg-white min-[810px]:block",
          railOnLeft ? "left-[-0.6875rem]" : "left-1/2 -translate-x-1/2",
          index === 0 ? "top-[-0.0625rem]" : "top-[-0.625rem]",
        )}
      >
        <span
          data-process-node-fill
          className="absolute inset-1 rounded-full bg-black opacity-0"
        />
      </span>
      <span
        aria-hidden="true"
        data-process-node
        className={cn(
          "pointer-events-none absolute bottom-[-0.6875rem] z-[2] hidden size-8 rounded-full border-[0.3125rem] border-black/10 bg-white min-[810px]:block",
          railOnLeft ? "left-[-0.6875rem]" : "left-1/2 -translate-x-1/2",
        )}
      >
        <span
          data-process-node-fill
          className="absolute inset-1 rounded-full bg-black opacity-0"
        />
      </span>
      <span
        aria-hidden="true"
        data-process-mobile-fill
        className="pointer-events-none absolute top-6 bottom-6 left-[-0.5rem] w-1 origin-top scale-y-0 bg-black min-[810px]:hidden"
      />

      <div
        data-process-media
        className={cn(
          "relative z-[1] order-1 aspect-[1619/971] w-full overflow-hidden bg-black/[0.04] max-[809px]:mb-5 min-[810px]:row-start-1",
          railOnLeft ? "min-[810px]:col-start-2" : "min-[810px]:col-start-1",
        )}
      >
        <VideoReveal
          src={step.video}
          poster={step.image}
          alt={step.imageAlt}
          className="size-full"
          parallax={16}
          loading={index === 0 ? "eager" : "lazy"}
        />
      </div>

      <div
        data-process-content
        className={cn(
          "relative z-[1] order-2 max-[809px]:pl-0 min-[810px]:row-start-1",
          railOnLeft
            ? "min-[810px]:col-start-1 min-[810px]:pl-[3.125rem]"
            : "min-[810px]:col-start-2 min-[810px]:pr-[3.125rem]",
        )}
      >
        <div
          data-process-number
          aria-label={`Step ${number}`}
          className="hero-outline-text relative flex h-[clamp(4rem,7vw,5.5625rem)] max-w-full items-start overflow-hidden font-heading text-[clamp(4rem,7vw,6rem)] leading-[0.93] font-semibold tracking-[-0.08em] opacity-20"
        >
          <span className="sr-only">Step {number}</span>
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 flex"
          >
            <span>0</span>
            <span
              data-process-number-strip
              data-digit={index + 1}
              className="flex flex-col"
              style={{ transform: "translateY(0%)" }}
            >
              {Array.from({ length: 10 }, (_, value) => (
                <span
                  key={value}
                  className="flex h-[1em] items-center leading-none"
                >
                  {value}
                </span>
              ))}
            </span>
          </span>
        </div>

        <div
          data-process-copy
          className="mt-9 flex items-center gap-4"
        >
          <Image
            data-process-icon
            src={icon.src}
            data-image-source={icon.src}
            alt=""
            aria-hidden="true"
            width={44}
            height={44}
            draggable={false}
            className="size-10 object-contain grayscale sm:size-11"
          />
          <h3 className="min-w-0 flex-1 font-heading text-[2.5rem] leading-none font-semibold tracking-[-0.03em] [text-wrap:balance] sm:text-[2.75rem]">
            {step.title}
          </h3>
        </div>
        <p
          data-process-copy
          className="mt-5 max-w-[30rem] font-sans text-sm leading-[1.65] tracking-[-0.005em] text-black/60"
        >
          {step.description}
        </p>
      </div>
    </li>
  );
}
