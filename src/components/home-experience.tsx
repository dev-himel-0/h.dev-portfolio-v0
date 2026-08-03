"use client";

import { useCallback, useState } from "react";
import { Hero } from "@/components/sections/hero";
import { Preloader } from "@/components/sections/preloader";

export function HomeExperience() {
  const [heroRevealed, setHeroRevealed] = useState(false);
  const revealHero = useCallback(() => setHeroRevealed(true), []);

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <Hero isRevealed={heroRevealed} />
      <Preloader onFinished={revealHero} />
    </main>
  );
}
