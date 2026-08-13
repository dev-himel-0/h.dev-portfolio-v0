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
  /** How the image fits its frame: "cover" crops to fill, "contain" shows it whole. */
  objectFit?: "cover" | "contain";
  start?: string;
  /** Lift the grayscale filter to full color when the parent `group` is hovered. */
  colorOnHover?: boolean;
}

/**
 * Clip-path image reveal: the frame wipes open top-to-bottom while the
 * photo scales 1.15 -> 1. Optional scrub parallax makes the photo drift
 * vertically as it scrolls through the viewport (applied to an oversized
 * wrapper so the `fill` image keeps its intrinsic sizing). Skipped under
 * `prefers-reduced-motion`.
 */
export function ImageReveal({
  src,
  alt,
  className,
  parallax = 0,
  objectFit = "cover",
  start = "top 85%",
  colorOnHover = false,
  ...rest
}: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scope = ref.current;
      const img = imgRef.current;
       if (!scope || !img) {
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
        const wrap = wrapRef.current;
        if (wrap) {
          gsap.fromTo(
            wrap,
            { yPercent: -24 },
            {
              yPercent: -2,
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
      }
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      data-image-reveal
      className={cn("relative overflow-hidden", className)}
    >
      <div data-image-viewport className="absolute inset-0 overflow-hidden">
        <div
          ref={wrapRef}
          className={cn(
            "absolute inset-x-0 top-0",
             parallax === 0 && "inset-0"
          )}
          style={parallax > 0 ? { height: "135%" } : undefined}
        >
          <Image
            ref={imgRef}
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={cn(
              `object-${objectFit} grayscale`,
              colorOnHover &&
                "transition-[filter] duration-700 ease-out group-hover:grayscale-0"
            )}
            {...rest}
          />
        </div>
      </div>
      </div>
  );
}
