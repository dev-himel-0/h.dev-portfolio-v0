"use client";

import { useCallback, useState } from "react";
import { About } from "@/components/sections/about";
import { Hero } from "@/components/sections/hero";
import { Preloader } from "@/components/sections/preloader";
import { Services } from "@/components/sections/services";
import { Work } from "@/components/sections/work";

export function HomeExperience() {
  const [heroRevealed, setHeroRevealed] = useState(false);
  const revealHero = useCallback(() => setHeroRevealed(true), []);

  return (
    <main className="w-full max-w-full overflow-x-clip">
      <Hero isRevealed={heroRevealed} />
      <About />
      <Work />
      <Services />
      <Preloader onFinished={revealHero} />
    </main>
  );
}
