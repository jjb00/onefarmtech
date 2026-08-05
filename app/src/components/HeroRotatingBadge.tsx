"use client";

import {useEffect, useState} from "react";
import {League_Spartan} from "next/font/google";

// A genuinely wide/expanded typeface, not just letter-spacing applied to
// the site's normal font -- League Spartan is built with generous default
// proportions, which is what was actually being asked for.
const badgeFont = League_Spartan({subsets: ["latin"], weight: "800"});

// One word -- "market" -- rotating across English and the three largest
// Nigerian languages, so it reads as an identity mark rather than a
// tagline. Yoruba (Oja), Igbo (Ahịa) and Hausa (Kasuwa) only for now --
// deliberately not guessing at Efik, Tiv, Nupe, Igala/Ebira or Ijaw
// translations for a live public site without a native speaker confirming
// the exact word first.
const WORDS = ["Market", "Oja", "Ahịa", "Kasuwa"];
const ROTATE_MS = 3400;

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
    <span className="oft-hero-badge-wipe-stage inline-flex min-w-[8ch] justify-center overflow-hidden">
      <span
        key={index}
        className={`${badgeFont.className} ${reducedMotion ? "" : "oft-hero-badge-wipe"}`}
      >
        {WORDS[index]}
      </span>
    </span>
  );
}
