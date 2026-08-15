"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CircleCursor = dynamic(
  () => import("@/components/ui/circle-cursor").then((mod) => mod.CircleCursor),
  { ssr: false },
);

/** Keeps the cursor and its motion dependency out of touch-device sessions. */
export function DesktopEnhancements() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (!enabled) {
    return (
      <div
        data-circle-cursor
        data-enabled="false"
        aria-hidden="true"
        className="circle-cursor"
      />
    );
  }

  return <CircleCursor />;
}
