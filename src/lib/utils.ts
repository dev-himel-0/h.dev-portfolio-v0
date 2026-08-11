import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** The site intentionally runs its full motion system for every visitor. */
export const FORCE_FULL_MOTION = true;

export function prefersReducedMotion() {
  return !FORCE_FULL_MOTION;
}
