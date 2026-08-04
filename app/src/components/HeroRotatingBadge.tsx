"use client";

import {useEffect, useState} from "react";

// Only English and Nigerian Pidgin for now -- deliberately holding off on
// Yoruba, Igbo and Hausa phrasing rather than guessing at translations for a
// live site aimed at exactly those speakers. Add real, confirmed versions
// here once supplied.
const PHRASES = [
  "Fresh produce ordering, made simpler",
  "Order fresh food, no wahala",
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
