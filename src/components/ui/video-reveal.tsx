"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import Image from "next/image";

import { ImageReveal } from "@/components/ui/image-reveal";
import { cn } from "@/lib/utils";

interface VideoRevealProps {
  src: string;
  poster: string;
  alt: string;
  className?: string;
  parallax?: number;
  loading?: ComponentProps<typeof Image>["loading"];
}

/** Poster-backed video that only loads and plays for fine-pointer hover. */
export function VideoReveal({
  src,
  poster,
  alt,
  className,
  parallax = 0,
  loading,
}: VideoRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video) return;

    const canHover = window.matchMedia(
      "(pointer: fine) and (prefers-reduced-motion: no-preference)",
    );

    if (!canHover.matches) return;

    const reset = () => {
      video.pause();
      video.currentTime = 0;
      root.classList.remove("is-playing");
      root.dataset.videoStatus = "idle";
    };

    const play = () => {
      root.dataset.videoStatus = "loading";

      void video
        .play()
        .then(() => {
          root.classList.add("is-playing");
          root.dataset.videoStatus = "playing";
        })
        .catch(() => {
          root.dataset.videoStatus = "error";
        });
    };

    const onVisibilityChange = () => {
      if (document.hidden) reset();
    };

    root.addEventListener("pointerenter", play);
    root.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      root.removeEventListener("pointerenter", play);
      root.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reset();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-video-reveal
      data-video-status="idle"
      className={cn("video-reveal relative size-full", className)}
    >
      <ImageReveal
        src={poster}
        alt={alt}
        className="absolute inset-0 size-full"
        parallax={parallax}
        colorOnHover
        loading={loading}
      />
      <video
        ref={videoRef}
        data-process-visual
        data-video-layer
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        className="video-reveal__video pointer-events-none absolute inset-0 size-full object-cover grayscale transition-[filter,opacity] duration-700 ease-out"
      />
    </div>
  );
}
