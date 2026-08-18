"use client";

import { MotionConfig } from "motion/react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      reducedMotion={process.env.NODE_ENV === "production" ? "user" : "never"}
    >
      {children}
    </MotionConfig>
  );
}
