"use client";

import { CurtainReveal } from "@/components/ui/curtain-reveal";
import { FlipFadeText } from "@/components/ui/flip-fade-text";
import { scrollToInstant } from "@/lib/wipe";
import { useLenis } from "lenis/react";
import { useEffect, useState } from "react";

const WORDS = ["Idea", "Design & Build", "Ship"];
const WORD_INTERVAL_MS = 2200;
/** Words flip in over letterDuration + staggerDelay * (len - 1). */
const LAST_WORD_FLIP_MS =
  0.6 * 1000 + 0.1 * 1000 * WORDS[WORDS.length - 1].length;
/** Hold the fully-formed last word before revealing. */
const HOLD_MS = 800;
/** Progress line duration — the line is the loader's timer. */
const PROGRESS_MS =
  (WORDS.length - 1) * WORD_INTERVAL_MS + LAST_WORD_FLIP_MS + HOLD_MS;

/**
 * Full-screen preloader: white words cycling on a black five-band curtain at
 * cinematic pacing, a white progress hairline filling across the bottom edge,
 * then the words fade and the bands wipe upward to reveal the page.
 */
export function Preloader({ onFinished }: { onFinished?: () => void }) {
  const [done, setDone] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    if (done) {
      lenis?.start();
      return;
    }

    lenis?.stop();
    scrollToInstant(0);
    return () => lenis?.start();
  }, [done, lenis]);

  if (done) return null;

  return (
    <CurtainReveal
      progress={PROGRESS_MS}
      onReveal={onFinished}
      onComplete={() => setDone(true)}
    >
      <FlipFadeText
        words={WORDS}
        interval={WORD_INTERVAL_MS}
        repeat={false}
        textClassName="text-white text-[clamp(2.5rem,11vw,4.5rem)]"
      />
    </CurtainReveal>
  );
}
