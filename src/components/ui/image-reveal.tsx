"use client";

import { useRef, type ComponentProps } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ImageRevealProps extends Omit<ComponentProps<typeof Image>, "fill"> {
  src: string;
  alt: string;
  className?: string;
  /** Parallax strength: the image drifts vertically while in view (0 = none). */
  parallax?: number;
  start?: string;
}

/**
 * Clip-path image reveal: the frame wipes open top-to-bottom while the
 * photo scales 1.15 -> 1. Optional scrub parallax makes the image drift
 * as it scrolls through the viewport. Skipped under `prefers-reduced-motion`.
 */
export function ImageReveal({
  src,
  alt,
  className,
  parallax = 0,
  start = "top 85%",
  ...rest
}: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      const scope = ref.current;
      const img = imgRef.current;
      if (!scope || !img || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      gsap
        .timeline({
          scrollTrigger: {
            trigger: scope,
            start,
            once: true,
          },
        })
        .fromTo(
          scope,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power4.inOut" }
        )
        .fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.4, ease: "power3.out" }, 0);

      if (parallax > 0) {
        gsap.fromTo(
          img,
          { yPercent: -16.33 },
          {
            yPercent: -0.33,
            ease: "none",
            scrollTrigger: {
              trigger: scope,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className={cn("object-cover grayscale", parallax > 0 && "max-w-none")}
        style={parallax > 0 ? { height: "120%" } : undefined}
        {...rest}
      />
    </div>
  );
}
