import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const seo = read("src/lib/publicSeo.ts");
const sitemap = read("src/app/sitemap.ts");
const robots = read("src/app/robots.ts");
const rootLayout = read("src/app/layout.tsx");
const analytics = read("src/components/UmamiAnalytics.tsx");

const indexableRoutes = [
  "/",
  "/order",
  "/order-request",
  "/buyer-account-request",
  "/contact",
  "/faq",
  "/careers",
  "/supplier-partners",
  "/privacy",
  "/data-protection",
  "/terms",
];

test("sitemap uses canonical production URLs for only approved public routes", () => {
  assert.match(seo, /SITE_URL = "https:\/\/onefarmtech\.com"/);
  assert.match(sitemap, /INDEXABLE_PUBLIC_ROUTES\.map/);
  for (const route of indexableRoutes) {
    assert.match(seo, new RegExp(`"${route.replaceAll("/", "\\/")}"`));
  }
  for (const privateRoute of ["/admin", "/api", "/buyer-account", "/buyer-login"]) {
    assert.doesNotMatch(
      seo.match(/INDEXABLE_PUBLIC_ROUTES = \[[\s\S]*?\] as const/)?.[0] || "",
      new RegExp(`"${privateRoute.replaceAll("/", "\\/")}"`),
    );
  }
});

test("robots blocks private, authenticated and callback route families", () => {
  for (const route of [
    "/admin",
    "/admin/",
    "/api/",
    "/buyer-account",
    "/buyer-account/",
    "/buyer-login",
    "/delivery-partner",
    "/delivery-partner/",
    "/partner-login",
    "/staff-login",
  ]) {
    assert.ok(robots.includes(`"${route}"`), `${route} must be disallowed`);
  }
  assert.match(robots, /sitemap: `\$\{SITE_URL\}\/sitemap\.xml`/);
});

test("every indexable route has unique metadata and canonical support", () => {
  const titles = [...seo.matchAll(/title:\s*"([^"]+)"/g)].map((match) => match[1]);
  const descriptions = [...seo.matchAll(/description:\s*\n?\s*"([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.equal(new Set(titles).size, indexableRoutes.length);
  assert.equal(new Set(descriptions).size, indexableRoutes.length);
  assert.match(seo, /alternates: \{canonical: path\}/);
  assert.match(rootLayout, /metadataBase: new URL\(SITE_URL\)/);
});

test("private layouts and login pages are explicitly noindex", () => {
  for (const file of [
    "src/app/admin/layout.tsx",
    "src/app/buyer-account/layout.tsx",
    "src/app/delivery-partner/layout.tsx",
    "src/app/login/page.tsx",
    "src/app/buyer-login/page.tsx",
    "src/app/partner-login/page.tsx",
    "src/app/dashboard/page.tsx",
  ]) {
    assert.match(read(file), /PRIVATE_NOINDEX_METADATA/);
  }
  assert.match(seo, /index: false/);
  assert.match(seo, /follow: false/);
});

test("structured data is JSON serialized safely and matches visible FAQ content", () => {
  const structuredData = read("src/components/StructuredData.tsx");
  const faq = read("src/app/faq/page.tsx");
  assert.match(structuredData, /JSON\.stringify\(data\)\.replace\(\/<\/g/);
  assert.match(rootLayout, /"@type": "Organization"/);
  assert.match(rootLayout, /"@type": "WebSite"/);
  assert.match(faq, /"@type": "FAQPage"/);
  assert.match(faq, /mainEntity: faqs\.map/);
});

test("analytics stays production-only, public-only and sends no query or form data", () => {
  assert.match(analytics, /process\.env\.NODE_ENV !== "production"/);
  assert.match(analytics, /data-auto-track="false"/);
  assert.match(analytics, /data-domains="onefarmtech\.com"/);
  assert.doesNotMatch(analytics, /searchParams\.toString|window\.location\.search[,}]/);
  assert.doesNotMatch(analytics, /\b(email|phone|message|cv|paymentReference):\s*/);
  assert.doesNotMatch(analytics, /FormData|\.value|files\[/);
  for (const route of ["/admin", "/api", "/buyer-account", "/buyer-login"]) {
    assert.doesNotMatch(
      analytics.match(/const PUBLIC_PATHS = new Set\(\[[\s\S]*?\]\)/)?.[0] || "",
      new RegExp(`"${route.replaceAll("/", "\\/")}"`),
    );
  }
});

test("conversion events and start wiring use fixed, non-personal names", () => {
  const conversionSources = [
    analytics,
    read("src/app/contact/page.tsx"),
    read("src/app/buyer-account-request/page.tsx"),
    read("src/app/order-request/page.tsx"),
    read("src/app/supplier-partners/page.tsx"),
    read("src/components/CareerApplicationModal.tsx"),
  ].join("\n");
  for (const event of [
    "whatsapp_cta_click",
    "contact_form_started",
    "contact_form_submitted",
    "buyer_account_request_started",
    "buyer_account_request_submitted",
    "careers_application_submitted",
    "supplier_enquiry_submitted",
    "order_request_started",
    "order_request_submitted",
    "buyer_login_opened",
  ]) {
    assert.ok(conversionSources.includes(event), `${event} must be wired`);
  }
});
