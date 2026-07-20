"use client";

import Script from "next/script";

export default function TurnstileWidget({action}: {action: string}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return <p className="rounded-xl bg-[#fff4ef] p-3 text-sm font-bold text-[#9b2f12]">Human verification is temporarily unavailable. Please try again shortly.</p>;
  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
    <div className="cf-turnstile" data-sitekey={siteKey} data-action={action} data-theme="light" />
  </>;
}
