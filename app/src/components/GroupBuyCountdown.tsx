"use client";

import {useEffect, useState} from "react";

function timeParts(msRemaining: number) {
  const clamped = Math.max(0, msRemaining);
  const totalMinutes = Math.floor(clamped / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return {days, hours, minutes};
}

export default function GroupBuyCountdown({
  targetIso,
  label,
}: {
  targetIso: string;
  label: string;
}) {
  const target = new Date(targetIso).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Renders nothing on the server / before hydration rather than a
  // mismatched guess -- "now" only exists client-side, so the first paint
  // shows the label alone and the numbers fill in a moment later.
  const parts = now !== null ? timeParts(target - now) : null;

  return (
    <p className="text-sm font-semibold text-white/65">
      {label}
      {parts ? (
        <span className="ml-1 font-black text-[#F2B84B]">
          {parts.days > 0 ? `${parts.days}d ` : ""}
          {parts.hours}h {parts.minutes}m
        </span>
      ) : null}
    </p>
  );
}
