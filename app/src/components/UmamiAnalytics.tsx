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
      track: (payload: {
        website: string;
        url: string;
        name?: string;
      }) => void;
    };
  }
}

const WEBSITE_ID = "5354e6ee-a9c9-4d16-82a3-bd54e8f603ee";
const SUBMISSION_EVENTS: Record<string, string> = {
  "/buyer-account-request": "buyer_account_request_submitted",
  "/careers": "careers_application_submitted",
  "/contact": "contact_form_submitted",
  "/order-request": "order_request_submitted",
  "/supplier-partners": "supplier_enquiry_submitted",
};

export default function UmamiAnalytics() {
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);
  const isPublicPage = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (isLoaded && isPublicPage) {
      window.umami?.track({ website: WEBSITE_ID, url: pathname });

      const submissionEvent = SUBMISSION_EVENTS[pathname];
      const params = new URLSearchParams(window.location.search);
      if (submissionEvent && params.get("submitted") === "1") {
        window.umami?.track({
          website: WEBSITE_ID,
          url: pathname,
          name: submissionEvent,
        });
      }
    }
  }, [isLoaded, isPublicPage, pathname]);

  useEffect(() => {
    if (!isLoaded || !isPublicPage) return;

    const startedForms = new WeakSet<HTMLFormElement>();
    const trackEvent = (name: string) => {
      window.umami?.track({
        website: WEBSITE_ID,
        url: window.location.pathname,
        name,
      });
    };
    const handleFocus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const form = target.closest<HTMLFormElement>("form[data-analytics-start]");
      if (!form || startedForms.has(form)) return;
      startedForms.add(form);
      const name = form.dataset.analyticsStart;
      if (name) trackEvent(name);
    };
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const explicitEvent = link.dataset.analyticsEvent;
      if (explicitEvent) {
        trackEvent(explicitEvent);
      } else if (link.href.startsWith("https://wa.me/")) {
        trackEvent("whatsapp_cta_click");
      } else if (link.pathname === "/buyer-login") {
        trackEvent("buyer_login_opened");
      }
    };

    document.addEventListener("focusin", handleFocus);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("click", handleClick);
    };
  }, [isLoaded, isPublicPage]);

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
