"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const PUBLIC_PATHS = new Set([
  "/",
  "/buyer-account-request",
  "/careers",
  "/careers/apply",
  "/contact",
  "/data-protection",
  "/delivery-partner",
  "/faq",
  "/order",
  "/order-request",
  "/privacy",
  "/supplier-partners",
  "/terms",
]);

declare global {
  interface Window {
    umami?: {
      track: (payload: { website: string; url: string }) => void;
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
      window.umami?.track({ website: WEBSITE_ID, url: pathname });
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
