import type {MetadataRoute} from "next";
import {SITE_URL} from "@/lib/publicSeo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/buyer-account",
        "/buyer-account/",
        "/buyer-login",
        "/callbacks/",
        "/dashboard",
        "/delivery-partner",
        "/delivery-partner/",
        "/login",
        "/partner-login",
        "/payment/",
        "/payments/",
        "/staff-login",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
