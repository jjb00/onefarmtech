"use client";

import Script from "next/script";
import {useCallback, useEffect, useRef, useState} from "react";
import {useFormStatus} from "react-dom";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

function SubmitButton({ready, idleLabel, pendingLabel}: {ready: boolean; idleLabel: string; pendingLabel: string}) {
  const {pending} = useFormStatus();
  return <button type="submit" disabled={!ready || pending} aria-disabled={!ready || pending} className="oft-primary-button rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white hover:bg-[#155c2f] disabled:cursor-not-allowed disabled:opacity-60">
    {pending ? pendingLabel : idleLabel}
  </button>;
}

export default function TurnstileWidget({action, idleLabel, pendingLabel}: {action: string; idleLabel: string; pendingLabel: string}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme: "light",
      callback: (nextToken: string) => setToken(nextToken),
      "expired-callback": () => setToken(""),
      "timeout-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
  }, [action, siteKey]);

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
    widgetIdRef.current = null;
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [renderWidget]);

  if (!siteKey) return <p className="rounded-xl bg-[#fff4ef] p-3 text-sm font-bold text-[#9b2f12]">Human verification is temporarily unavailable. Please try again shortly.</p>;
  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={renderWidget} />
    <div ref={containerRef} />
    <input type="hidden" name="cf-turnstile-response" value={token} readOnly />
    <SubmitButton ready={Boolean(token)} idleLabel={idleLabel} pendingLabel={pendingLabel} />
    {!token ? <p className="text-xs font-semibold text-[#587063]" aria-live="polite">Complete human verification to enable submission.</p> : null}
  </>;
}
