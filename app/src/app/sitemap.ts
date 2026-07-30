import type {MetadataRoute} from "next";
import {
  canonicalUrl,
  INDEXABLE_PUBLIC_ROUTES,
} from "@/lib/publicSeo";

const routeSettings: Record<
  (typeof INDEXABLE_PUBLIC_ROUTES)[number],
  Pick<MetadataRoute.Sitemap[number], "changeFrequency" | "priority">
> = {
  "/": {changeFrequency: "weekly", priority: 1},
  "/order": {changeFrequency: "monthly", priority: 0.9},
  "/order-request": {changeFrequency: "monthly", priority: 0.9},
  "/buyer-account-request": {changeFrequency: "monthly", priority: 0.8},
  "/contact": {changeFrequency: "monthly", priority: 0.6},
  "/faq": {changeFrequency: "monthly", priority: 0.7},
  "/careers": {changeFrequency: "weekly", priority: 0.6},
  "/supplier-partners": {changeFrequency: "monthly", priority: 0.6},
  "/privacy": {changeFrequency: "yearly", priority: 0.2},
  "/data-protection": {changeFrequency: "yearly", priority: 0.2},
  "/terms": {changeFrequency: "yearly", priority: 0.2},
};

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PUBLIC_ROUTES.map((route) => ({
    url: canonicalUrl(route),
    ...routeSettings[route],
  }));
}
