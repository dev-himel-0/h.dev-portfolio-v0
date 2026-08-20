"use client";

import { cn } from "@/lib/utils";
import { useState, type CSSProperties } from "react";
import type { IconType } from "react-icons";

export interface MaskedAvatarItem {
  name: string;
  icon?: IconType;
}

interface MaskedAvatarsProps {
  items: MaskedAvatarItem[];
  size?: number;
  overlap?: number;
  className?: string;
  "aria-label"?: string;
}

/**
 * A compact, keyboard-accessible stack of overlapping technology avatars.
 * The mask keeps each icon legible while the active item lifts out of the row.
 */
export function MaskedAvatars({
  items,
  size = 46,
  overlap = 16,
  className,
  "aria-label": ariaLabel = "Technology stack",
}: MaskedAvatarsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div
      data-tech-stack
      role="group"
      aria-label={ariaLabel}
      className={cn("relative flex items-end overflow-visible", className)}
    >
      <ul
        role="list"
        className="m-0 flex list-none items-end p-0"
        style={{ paddingTop: 0 }}
      >
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          const isNeighbor =
            activeIndex !== null && Math.abs(activeIndex - index) === 1;
          const Icon = item.icon;

          return (
            <li
              key={item.name}
              data-tech-avatar
              role="listitem"
              aria-label={item.name}
              tabIndex={0}
              onPointerEnter={() => setActiveIndex(index)}
              onPointerLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              className="group relative shrink-0 transition-transform duration-200 ease-out outline-none"
              style={
                {
                  width: size,
                  height: size,
                  marginLeft: index === 0 ? 0 : -overlap,
                  zIndex: items.length - index,
                  transform: `translateY(${isActive ? -10 : isNeighbor ? 2 : 0}px) scale(${isActive ? 1.08 : 1})`,
                } as CSSProperties
              }
            >
              <div
                className={cn(
                  "flex size-full items-center justify-center rounded-full border-[3px] border-black/15 bg-white text-black shadow-[0_0_0_1px_rgba(0,0,0,0.08)]",
                  "group-focus-visible:ring-2 group-focus-visible:ring-black group-focus-visible:ring-offset-2",
                )}
                style={
                  {
                    WebkitMaskImage:
                      index === 0
                        ? undefined
                        : "linear-gradient(to right, transparent 0, black 26%, black 100%)",
                    maskImage:
                      index === 0
                        ? undefined
                        : "linear-gradient(to right, transparent 0, black 26%, black 100%)",
                  } as CSSProperties
                }
              >
                <span
                  data-tech-icon
                  aria-hidden="true"
                  className="text-black"
                >
                  {Icon ? (
                    <Icon
                      aria-hidden="true"
                      size={size * 0.48}
                    />
                  ) : (
                    <span className="font-sans text-sm font-medium">
                      {item.name.slice(0, 1)}
                    </span>
                  )}
                </span>
              </div>

              <span
                data-tech-label
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 font-sans text-[0.6875rem] tracking-[0.08em] whitespace-nowrap text-black uppercase",
                  "transition-[opacity,transform,filter] duration-200",
                  isActive
                    ? "blur-0 translate-y-0 opacity-100"
                    : "translate-y-1 opacity-0 blur-[3px]",
                )}
              >
                {item.name}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
