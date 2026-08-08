"use client";

import { useCallback, useState } from "react";
import { About } from "@/components/sections/about";
import { Hero } from "@/components/sections/hero";
import { Preloader } from "@/components/sections/preloader";
import { Services } from "@/components/sections/services";
import { Stack } from "@/components/sections/stack";
import { Work } from "@/components/sections/work";
import { isSoftNavigation } from "@/lib/navigation";

export function HomeExperience() {
  // On a client-side arrival the page transition wipe replaces the preloader:
  // the hero starts its masked entrance right as the curtain lifts. Hard
  // loads keep the full preloader sequence.
  const softNavigation = useState(() => isSoftNavigation())[0];
  const [heroRevealed, setHeroRevealed] = useState(softNavigation);
  const revealHero = useCallback(() => setHeroRevealed(true), []);

  return (
    <main className="w-full max-w-full overflow-x-clip">
      <Hero
        isRevealed={heroRevealed}
        entranceDelay={softNavigation ? 0.15 : undefined}
      />
      <About />
      <Work />
      <Services />
      <Stack />
      {softNavigation ? null : <Preloader onFinished={revealHero} />}
    </main>
  );
}
