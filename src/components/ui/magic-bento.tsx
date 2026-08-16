"use client";

import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MagicBentoGridProps {
  children: ReactNode;
  className?: string;
}

interface MagicBentoCellProps {
  children: ReactNode;
  className?: string;
}

const spotStyle = {
  "--spot-x": "50%",
  "--spot-y": "50%",
  "--spot-opacity": "0",
  "--spot-scale": "1.2",
} as CSSProperties;

function updateSpot(event: PointerEvent<HTMLDivElement>) {
  if (
    event.pointerType === "touch" ||
    !window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) {
    return;
  }

  const cell = event.currentTarget;
  const rect = cell.getBoundingClientRect();
  cell.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
  cell.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
}

export function MagicBentoGrid({ children, className }: MagicBentoGridProps) {
  return (
    <div
      data-magic-bento
      className={cn("grid grid-cols-1 md:grid-cols-2", className)}
    >
      {children}
    </div>
  );
}

export function MagicBentoCell({ children, className }: MagicBentoCellProps) {
  return (
    <div
      data-bento-cell
      className={cn(
        "group relative overflow-hidden border-r border-b border-black/10 outline-none",
        "focus-within:z-10 focus-within:border-black/30",
        className,
      )}
      style={spotStyle}
      onPointerMove={updateSpot}
      onPointerEnter={(event) => {
        if (
          event.pointerType !== "touch" &&
          window.matchMedia("(hover: hover) and (pointer: fine)").matches
        ) {
          event.currentTarget.style.setProperty("--spot-opacity", "1");
          event.currentTarget.style.setProperty("--spot-scale", "1");
        }
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--spot-opacity", "0");
        event.currentTarget.style.setProperty("--spot-scale", "1.2");
      }}
    >
      <span
        aria-hidden="true"
        data-bento-spotlight
        className="pointer-events-none absolute top-0 left-0 size-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/[0.07] opacity-[var(--spot-opacity)] blur-2xl transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          left: "var(--spot-x)",
          top: "var(--spot-y)",
          transform: "translate(-50%, -50%) scale(var(--spot-scale))",
        }}
      />
      <div className="relative z-[1] h-full min-w-0">{children}</div>
    </div>
  );
}
