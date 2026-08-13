import type {Metadata} from "next";

export const SITE_URL = "https://onefarmtech.com";
export const SITE_NAME = "OneFarmTech";
export const DEFAULT_DESCRIPTION =
  "Fresh produce sourcing and bulk food supply for Nigerian restaurants, hotels, caterers, retailers, offices, buying groups and households.";

export const INDEXABLE_PUBLIC_ROUTES = [
  "/",
  "/products",
  "/order",
  "/order-request",
  "/buyer-account-request",
  "/group-buy-request",
  "/contact",
  "/faq",
  "/careers",
  "/supplier-partners",
  "/privacy",
  "/data-protection",
  "/terms",
  "/impact",
  "/dashboard",
] as const;

export const PUBLIC_ROUTE_METADATA = {
  "/": {
    title: "Fresh Produce Supplier for Nigerian Buyers",
    description:
      "Source fresh produce for restaurants, hotels, caterers, retailers, offices, groups and households through OneFarmTech's WhatsApp-first ordering.",
  },
  "/products": {
    title: "Fresh Food Products and Produce Categories",
    description:
      "Browse the fresh produce, staples, poultry, meat and seafood categories supplied by OneFarmTech, with availability confirmed before ordering.",
  },
  "/order": {
    title: "Order Fresh Produce by WhatsApp or Online",
    description:
      "Start a fresh produce order by WhatsApp or send a structured request for bulk, recurring, business, group or household supply.",
  },
  "/order-request": {
    title: "Request Bulk and Recurring Produce Supply",
    description:
      "Tell OneFarmTech what produce you need, in what quantity and when. The team confirms availability, pricing and fulfilment before payment.",
  },
  "/buyer-account-request": {
    title: "Request a Recurring Buyer Account",
    description:
      "Request a OneFarmTech buyer account for recurring produce procurement, structured order records, receipts and business supply support.",
  },
  "/group-buy-request": {
    title: "Start a Group Buy",
    description:
      "Propose a group buy for your street, office or business. OneFarmTech reviews and opens it once pricing and quantity are confirmed.",
  },
  "/contact": {
    title: "Contact OneFarmTech",
    description:
      "Contact OneFarmTech about buyer support, fresh food supply, commercial partnerships, logistics, payments or ecosystem collaboration.",
  },
  "/faq": {
    title: "Fresh Produce Ordering FAQ",
    description:
      "Answers about WhatsApp produce ordering, bulk and group buying, buyer accounts, payments, availability and fulfilment with OneFarmTech.",
  },
  "/careers": {
    title: "Careers at OneFarmTech",
    description:
      "Explore current OneFarmTech roles supporting fresh produce sourcing, buyer growth, quality, operations and food supply.",
  },
  "/supplier-partners": {
    title: "Become a Produce Supplier or Partner",
    description:
      "Farms, aggregators, cooperatives, processors and logistics partners can enquire about supporting reliable OneFarmTech fresh food supply.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description:
      "How OneFarmTech collects, uses, shares and retains information needed for orders, accounts, payments, delivery and support.",
  },
  "/data-protection": {
    title: "Data Protection",
    description:
      "How OneFarmTech protects operational records, account data, access codes and information handled by service providers.",
  },
  "/terms": {
    title: "Terms of Use",
    description:
      "Terms governing OneFarmTech fresh produce orders, availability, fulfilment, payments, receipts and acceptable service use.",
  },
  "/impact": {
    title: "Impact",
    description:
      "How OneFarmTech's managed fresh produce sourcing supports farmers, suppliers and buyers across the food supply chain.",
  },
  "/dashboard": {
    title: "Order Fresh Produce or Start a Group Buy",
    description:
      "Order fresh produce, request bulk or recurring supply, start a group buy, or sign in to an approved buyer account with OneFarmTech.",
  },
} as const satisfies Record<
  (typeof INDEXABLE_PUBLIC_ROUTES)[number],
  {title: string; description: string}
>;

export function canonicalUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function publicPageMetadata(
  path: keyof typeof PUBLIC_ROUTE_METADATA,
): Metadata {
  const page = PUBLIC_ROUTE_METADATA[path];

  return {
    title: page.title,
    description: page.description,
    alternates: {canonical: path},
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: path,
      title: page.title,
      description: page.description,
      locale: "en_NG",
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
    },
  };
}

export const PRIVATE_NOINDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};
