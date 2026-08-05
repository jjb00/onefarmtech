"use client";

import {useEffect, useState} from "react";

// One word -- "market" -- rotating across English and the three largest
// Nigerian languages, so it reads as an identity mark rather than a
// tagline. Yoruba (Oja), Igbo (Ahịa) and Hausa (Kasuwa) only for now --
// deliberately not guessing at Efik, Tiv, Nupe, Igala/Ebira or Ijaw
// translations for a live public site without a native speaker confirming
// the exact word first.
const WORDS = ["Market", "Oja", "Ahịa", "Kasuwa"];
const ROTATE_MS = 2600;

export default function HeroRotatingBadge() {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % WORDS.length);
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="oft-hero-badge-flip-stage inline-flex min-w-[7.5ch] justify-center">
      <span
        key={index}
        className={reducedMotion ? undefined : "oft-hero-badge-flip"}
      >
        {WORDS[index]}
      </span>
    </span>
  );
}
