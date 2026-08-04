"use client";

import {useEffect, useState} from "react";

// One word -- "market" -- rotating across languages instead of a translated
// slogan, so it reads as an identity mark rather than a tagline. Limited to
// languages we're confident are correct: English, Nigerian Pidgin, Yoruba,
// Igbo, Hausa and Efik, chosen to match the regions OneFarmTech actually
// recruits and operates in (see careers page location list). Tiv (Benue),
// Nupe (Niger State), Igala/Ebira (Kogi) and Ijaw (Rivers) are real
// candidates for the same reason, but are deliberately left out until a
// native speaker confirms the exact word -- guessing here risks an
// embarrassing, disrespectful mistranslation on a live public site aimed at
// exactly those speakers.
const PHRASES = [
  "Market",
  "Local Market",
  "Oja",
  "Ahịa",
  "Kasuwa",
  "Urua",
];

const ROTATE_MS = 3800;

export default function HeroRotatingBadge() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % PHRASES.length);
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <span key={index} className="oft-hero-badge-rotate">
      {PHRASES[index]}
    </span>
  );
}
