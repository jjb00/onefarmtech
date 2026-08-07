"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const PUBLIC_PATHS = new Set([
  "/",
  "/buyer-account-request",
  "/buyer-login",
  "/careers",
  "/careers/apply",
  "/contact",
  "/data-protection",
  "/delivery-partner",
  "/faq",
  "/group-buy-request",
  "/impact",
  "/order",
  "/order-request",
  "/partner-login",
  "/privacy",
  "/supplier-partners",
  "/terms",
]);

type UmamiTrackProps = {website: string; url: string; [key: string]: unknown};

declare global {
  interface Window {
    umami?: {
      track: (arg: UmamiTrackProps | ((props: UmamiTrackProps) => UmamiTrackProps)) => void;
    };
  }
}

const WEBSITE_ID = "5354e6ee-a9c9-4d16-82a3-bd54e8f603ee";

export default function UmamiAnalytics() {
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);
  const isPublicPage = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (isLoaded && isPublicPage) {
      // Umami's track() only merges in its own default context (hostname,
      // referrer, screen, language, etc.) when called with a function that
      // receives and extends that context -- passing a plain object instead
      // replaces the context entirely with just what's given here, which
      // silently drops every field the collector needs to record a valid
      // pageview. That was the actual bug: the script loaded fine and
      // window.umami existed, but every "tracked" view was really an
      // incomplete payload that never landed in the dashboard.
      window.umami?.track((props) => ({ ...props, website: WEBSITE_ID, url: pathname }));
    }
  }, [isLoaded, isPublicPage, pathname]);

  if (process.env.NODE_ENV !== "production" || !isPublicPage) {
    return null;
  }

  return (
    <Script
      defer
      src="https://cloud.umami.is/script.js"
      data-website-id={WEBSITE_ID}
      data-domains="onefarmtech.com"
      data-auto-track="false"
      onLoad={() => setIsLoaded(true)}
    />
  );
}
