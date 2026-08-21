"use client";

import { SectionRail } from "@/components/ui/section-rail";
import { SectionReveal } from "@/components/ui/section-reveal";
import { VideoReveal } from "@/components/ui/video-reveal";
import { LightbulbIcon, RocketLaunchIcon } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { processSection, processSteps, type ProcessIcon } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import type { IconType } from "react-icons";
import { SiFigma, SiReact } from "react-icons/si";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ProcessIconComponent = Icon | IconType;

const processIcons: Record<ProcessIcon, ProcessIconComponent> = {
  idea: LightbulbIcon,
  design: SiFigma,
  build: SiReact,
  ship: RocketLaunchIcon,
};

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

      const steps = Array.from(
        flow.querySelectorAll<HTMLElement>("[data-process-step]"),
      );
      const cleanups: Array<() => void> = [];
      let snappingActive = true;
      let snapFrame = 0;

      // Grid dimensions can end on fractional pixels. Snap each rail on its
      // thickness axis so horizontal and vertical strokes rasterize evenly.
      const snapTimelineTracks = () => {
        const dpr = window.devicePixelRatio || 1;
        const snapTrack = (track: HTMLElement, axis: "x" | "y") => {
          const setAxis = (value: number) =>
            gsap.set(
              track,
              axis === "x"
                ? { x: value, autoRound: false }
                : { y: value, autoRound: false },
            );

          setAxis(0);
          const rect = track.getBoundingClientRect();
          const coordinate = axis === "x" ? rect.left : rect.top;
          const snappedCoordinate = Math.round(coordinate * dpr) / dpr;
          setAxis(snappedCoordinate - coordinate);
        };

        flow
          .querySelectorAll<HTMLElement>("[data-process-desktop-track]")
          .forEach((track) => snapTrack(track, "x"));
        flow
          .querySelectorAll<HTMLElement>("[data-process-horizontal-track]")
          .forEach((track) => snapTrack(track, "y"));
      };
      const scheduleTrackSnap = () => {
        if (isMobile || !snappingActive) return;
        cancelAnimationFrame(snapFrame);
        snapFrame = requestAnimationFrame(() => {
          if (snappingActive) snapTimelineTracks();
        });
      };

      if (!isMobile) {
        scheduleTrackSnap();
        window.addEventListener("resize", scheduleTrackSnap);
        ScrollTrigger.addEventListener("refresh", scheduleTrackSnap);
        void document.fonts?.ready?.then(scheduleTrackSnap);
        cleanups.push(() => {
          snappingActive = false;
          cancelAnimationFrame(snapFrame);
          window.removeEventListener("resize", scheduleTrackSnap);
          ScrollTrigger.removeEventListener("refresh", scheduleTrackSnap);
        });
      }

      steps.forEach((step, index) => {
        const media = step.querySelector<HTMLElement>("[data-process-media]");
        const visuals = Array.from(
          media?.querySelectorAll<HTMLElement>("img, [data-process-visual]") ??
            [],
        );
        const copy = Array.from(
          step.querySelectorAll<HTMLElement>("[data-process-copy]"),
        );
        const numberStrip = step.querySelector<HTMLElement>(
          "[data-process-number-strip]",
        );
        const verticalFills = Array.from(
          step.querySelectorAll<HTMLElement>("[data-process-vertical-fill]"),
        );
        const horizontalFill = step.querySelector<HTMLElement>(
          "[data-process-horizontal-fill]",
        );
        const nodes = Array.from(
          step.querySelectorAll<HTMLElement>("[data-process-node-fill]"),
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
          const reveal = gsap.timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: step,
              start: "top 84%",
              onEnter: (self) =>
                requestAnimationFrame(() => self.kill(false, true)),
            },
          });

          reveal
            .fromTo(
              media,
              { autoAlpha: 0, y: 24 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.65,
              },
            )
            .fromTo(
              copy,
              { autoAlpha: 0, y: 16 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.55,
                stagger: 0.05,
              },
              0.08,
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
      className="relative overflow-clip bg-white py-20 text-black sm:py-24 lg:py-28"
    >
      <SectionRail
        sectionRef={rootRef}
        contentRef={flowRef}
        index={processSection.index}
        side="left"
      />

      <div className="process-container">
        <SectionReveal
          variant="fade"
          distance={32}
        >
          <header
            data-reveal
            data-process-heading
            className="mb-10 flex w-full flex-col items-end gap-7 text-right sm:mb-12 lg:mb-16"
          >
            <span
              data-process-label
              className="sr-only"
            >
              {processSection.index} / PROCESS
            </span>
            <h2
              id="how-i-work-heading"
              className="section-heading font-heading font-semibold tracking-[-0.045em] whitespace-nowrap"
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
          className="relative"
        >
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
  const ProcessIcon = processIcons[step.icon];

  return (
    <li
      data-process-step
      className={cn(
        "group relative max-[809px]:py-5 min-[810px]:grid min-[810px]:grid-cols-2 min-[810px]:items-center min-[810px]:gap-x-12 min-[810px]:py-8 min-[810px]:pb-10",
        last && "min-[810px]:pb-8",
      )}
    >
      <div
        aria-hidden="true"
        data-process-desktop-track
        className={cn(
          "pointer-events-none absolute top-0 bottom-0 hidden w-[2px] bg-black/10 min-[810px]:block",
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
            "pointer-events-none absolute bottom-0 hidden h-[2px] w-1/2 bg-black/10 min-[810px]:block",
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
          "pointer-events-none absolute z-[2] hidden size-5 rounded-full border-2 border-black/10 bg-white min-[810px]:block",
          railOnLeft ? "left-[-0.625rem]" : "left-1/2 -translate-x-1/2",
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
          "pointer-events-none absolute bottom-[-0.625rem] z-[2] hidden size-5 rounded-full border-2 border-black/10 bg-white min-[810px]:block",
          railOnLeft ? "left-[-0.625rem]" : "left-1/2 -translate-x-1/2",
        )}
      >
        <span
          data-process-node-fill
          className="absolute inset-1 rounded-full bg-black opacity-0"
        />
      </span>
      <div
        data-process-media
        className={cn(
          "relative z-[1] order-1 aspect-[16/9] w-full overflow-hidden bg-black/[0.04] max-[809px]:mb-4 min-[810px]:row-start-1 min-[810px]:aspect-[1.85]",
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
            ? "min-[810px]:col-start-1 min-[810px]:pl-8"
            : "min-[810px]:col-start-2 min-[810px]:pr-8",
        )}
      >
        <div
          data-process-number
          aria-label={`Step ${number}`}
          className="hero-outline-text relative flex h-[clamp(3.25rem,5.5vw,4.75rem)] max-w-full items-start overflow-hidden font-heading text-[clamp(3.25rem,5.5vw,5rem)] leading-[0.93] font-semibold tracking-[-0.08em] opacity-20"
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
          className="mt-5 flex items-center gap-4"
        >
          <span
            data-process-icon
            className="flex size-9 shrink-0 items-center justify-center sm:size-10"
          >
            <ProcessIcon
              aria-hidden="true"
              className="size-full"
            />
          </span>
          <h3 className="min-w-0 flex-1 font-heading text-[2.25rem] leading-none font-semibold tracking-[-0.03em] [text-wrap:balance] sm:text-[2.5rem]">
            {step.title}
          </h3>
        </div>
        <p
          data-process-copy
          className="mt-3 max-w-[30rem] font-sans text-[0.9375rem] leading-[1.6] tracking-[-0.005em] text-black/60"
        >
          {step.description}
        </p>
      </div>
    </li>
  );
}
