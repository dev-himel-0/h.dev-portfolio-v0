"use client";

import { useCallback, useState } from "react";
import { Hero } from "@/components/sections/hero";
import { Preloader } from "@/components/sections/preloader";
import { Work } from "@/components/sections/work";

export function HomeExperience() {
  const [heroRevealed, setHeroRevealed] = useState(false);
  const revealHero = useCallback(() => setHeroRevealed(true), []);

  return (
    <main className="w-full max-w-full overflow-x-clip">
      <Hero isRevealed={heroRevealed} />
      <Work />
      <Preloader onFinished={revealHero} />
    </main>
  );
}
