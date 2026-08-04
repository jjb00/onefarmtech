"use client";

import {useEffect, useRef, useState} from "react";

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
const WORDS = [
  "Market",
  "Local Market",
  "Oja",
  "Ahịa",
  "Kasuwa",
  "Urua",
];

const TYPE_MS = 90;
const DELETE_MS = 45;
const PAUSE_AFTER_TYPE_MS = 1500;
const PAUSE_AFTER_DELETE_MS = 300;
const SWAP_MS = 2200;

export default function HeroRotatingBadge() {
  const [text, setText] = useState(WORDS[0]);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Reduced motion still gets the word rotating -- it just swaps instantly
  // instead of typing it out. Cutting the animation is right; freezing the
  // content update entirely (the previous version's bug) is not.
  useEffect(() => {
    if (reducedMotion !== true) return;
    let wordIndex = 0;
    const interval = setInterval(() => {
      wordIndex = (wordIndex + 1) % WORDS.length;
      setText(WORDS[wordIndex]);
    }, SWAP_MS);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  const wordIndexRef = useRef(0);

  useEffect(() => {
    if (reducedMotion !== false) return;

    let charIndex = 0;
    let phase: "typing" | "pausing" | "deleting" | "waiting" = "typing";
    let timeoutId: ReturnType<typeof setTimeout>;

    const step = () => {
      const word = WORDS[wordIndexRef.current];

      if (phase === "typing") {
        charIndex += 1;
        setText(word.slice(0, charIndex));
        if (charIndex >= word.length) {
          phase = "pausing";
          timeoutId = setTimeout(step, PAUSE_AFTER_TYPE_MS);
          return;
        }
        timeoutId = setTimeout(step, TYPE_MS);
        return;
      }

      if (phase === "pausing") {
        phase = "deleting";
        timeoutId = setTimeout(step, DELETE_MS);
        return;
      }

      if (phase === "deleting") {
        charIndex -= 1;
        setText(word.slice(0, charIndex));
        if (charIndex <= 0) {
          phase = "waiting";
          timeoutId = setTimeout(step, PAUSE_AFTER_DELETE_MS);
          return;
        }
        timeoutId = setTimeout(step, DELETE_MS);
        return;
      }

      // waiting
      wordIndexRef.current = (wordIndexRef.current + 1) % WORDS.length;
      phase = "typing";
      timeoutId = setTimeout(step, TYPE_MS);
    };

    timeoutId = setTimeout(step, TYPE_MS);
    return () => clearTimeout(timeoutId);
  }, [reducedMotion]);

  return (
    <span className="inline-flex items-baseline">
      {text}
      <span className="oft-hero-badge-cursor ml-0.5" aria-hidden="true">
        |
      </span>
    </span>
  );
}
