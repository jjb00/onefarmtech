"use client";

import {useEffect, useState} from "react";

function timeParts(msRemaining: number) {
  const clamped = Math.max(0, msRemaining);
  const totalSeconds = Math.floor(clamped / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {days, hours, minutes, seconds};
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function Digit({value, unit}: {value: number; unit: string}) {
  return (
    <div className="flex min-w-[2.75rem] flex-col items-center rounded-lg bg-white/10 px-2 py-1.5">
      <span className="font-mono text-lg font-black tabular-nums leading-none text-[#F2B84B]">
        {pad(value)}
      </span>
      <span className="mt-1 text-[0.6rem] font-bold uppercase leading-none tracking-[0.12em] text-white/45">
        {unit}
      </span>
    </div>
  );
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
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Renders a fixed-height placeholder on the server / before hydration
  // rather than a mismatched guess -- "now" only exists client-side, so the
  // digits fill in a moment after first paint without the card jumping.
  const parts = now !== null ? timeParts(target - now) : null;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">{label}</p>
      <div className="mt-2 flex h-[3.1rem] items-center gap-1.5">
        {parts ? (
          <>
            {parts.days > 0 ? (
              <>
                <Digit value={parts.days} unit="day" />
                <span className="pb-3 text-white/25">:</span>
              </>
            ) : null}
            <Digit value={parts.hours} unit="hr" />
            <span className="pb-3 text-white/25">:</span>
            <Digit value={parts.minutes} unit="min" />
            <span className="pb-3 text-white/25">:</span>
            <Digit value={parts.seconds} unit="sec" />
          </>
        ) : null}
      </div>
    </div>
  );
}
