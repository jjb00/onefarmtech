import type {MetadataRoute} from "next";
import {
  CAREERS_LAST_MODIFIED,
  careerPath,
  careerRoles,
} from "@/lib/careers";
import {
  canonicalUrl,
  INDEXABLE_PUBLIC_ROUTES,
} from "@/lib/publicSeo";

const routeSettings: Record<
  (typeof INDEXABLE_PUBLIC_ROUTES)[number],
  Pick<MetadataRoute.Sitemap[number], "changeFrequency" | "priority">
> = {
  "/": {changeFrequency: "weekly", priority: 1},
  "/products": {changeFrequency: "weekly", priority: 0.9},
  "/order": {changeFrequency: "monthly", priority: 0.9},
  "/order-request": {changeFrequency: "monthly", priority: 0.9},
  "/buyer-account-request": {changeFrequency: "monthly", priority: 0.8},
  "/group-buy-request": {changeFrequency: "monthly", priority: 0.7},
  "/contact": {changeFrequency: "monthly", priority: 0.6},
  "/faq": {changeFrequency: "monthly", priority: 0.7},
  "/careers": {changeFrequency: "weekly", priority: 0.6},
  "/supplier-partners": {changeFrequency: "monthly", priority: 0.6},
  "/privacy": {changeFrequency: "yearly", priority: 0.2},
  "/data-protection": {changeFrequency: "yearly", priority: 0.2},
  "/terms": {changeFrequency: "yearly", priority: 0.2},
  "/impact": {changeFrequency: "monthly", priority: 0.5},
  "/dashboard": {changeFrequency: "monthly", priority: 0.6},
};

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes: MetadataRoute.Sitemap = INDEXABLE_PUBLIC_ROUTES.map(
    (route) => ({
      url: canonicalUrl(route),
      ...(route === "/careers"
        ? {lastModified: CAREERS_LAST_MODIFIED}
        : {}),
      ...routeSettings[route],
    }),
  );

  const careerRoutes: MetadataRoute.Sitemap = careerRoles.map((role) => ({
    url: canonicalUrl(careerPath(role)),
    lastModified: CAREERS_LAST_MODIFIED,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...publicRoutes, ...careerRoutes];
}
