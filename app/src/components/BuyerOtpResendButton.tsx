"use client";

import {useEffect, useState} from "react";
import {useFormStatus} from "react-dom";

export default function BuyerOtpResendButton({cooldownSeconds = 60}: {cooldownSeconds?: number}) {
  const {pending} = useFormStatus();
  const [remaining, setRemaining] = useState(cooldownSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  const disabled = pending || remaining > 0;
  const label = pending
    ? "Sending…"
    : remaining > 0
      ? `Resend available in ${remaining}s`
      : "Resend code";

  return (
    <button
      type="submit"
      disabled={disabled}
      aria-disabled={disabled}
      className="w-full rounded-full border border-[#1f7a3f]/20 bg-white px-6 py-3 text-sm font-black text-[#1f7a3f] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
