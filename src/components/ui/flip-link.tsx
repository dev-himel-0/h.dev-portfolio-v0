import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface FlipLinkProps {
  href: string;
  label: string;
  icon?: Icon;
  variant?: "solid" | "outline";
  className?: string;
}

/**
 * Animated CTA. Path hrefs (`/...`) render through `next/link` so navigation
 * stays client-side and the route transition wipe plays; anchors, mailto and
 * external URLs stay plain `<a>`.
 */
export function FlipLink({
  href,
  label,
  icon: Icon,
  variant = "solid",
  className,
}: FlipLinkProps) {
  const classes = cn(
    "group inline-flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden border px-7 text-[0.9375rem] font-normal tracking-[-0.01em] transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 sm:w-auto",
    variant === "solid"
      ? "border-black bg-black text-white hover:bg-white hover:text-black"
      : "border-black bg-white text-black/85 hover:bg-black/5 hover:text-black",
    className
  );

  const content = (
    <>
      <span className="relative block h-[1.35em] overflow-hidden leading-[1.35]">
        <span className="block transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full">
          {label}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-full block transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full"
        >
          {label}
        </span>
      </span>
      {Icon ? (
        <Icon
          aria-hidden="true"
          weight="regular"
          className="size-[1.05rem] transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:translate-x-1 group-focus-visible:-translate-y-1 group-focus-visible:translate-x-1"
        />
      ) : null}
    </>
  );

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} className={classes}>
      {content}
    </a>
  );
}
