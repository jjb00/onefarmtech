import {canonicalUrl, SITE_URL} from "@/lib/publicSeo";

export type CareerRole = {
  slug: string;
  title: string;
  department: string;
  stages: string[];
  locations: string[];
  qualification: string;
  summary: string;
  details: string;
  datePosted: string;
};

export const CAREERS_LAST_MODIFIED = "2026-08-13";

export const careerRoles: CareerRole[] = [
  {
    slug: "produce-sourcing-associate",
    title: "Produce Sourcing Associate",
    department: "Supply & Procurement",
    stages: ["Full-time", "Part-time", "Contract", "NYSC"],
    locations: ["Plateau", "Jos", "Benue", "Nasarawa", "Kogi", "Kwara", "Niger", "Taraba", "Kaduna", "Kano"],
    qualification: "OND, HND, degree or strong produce-market experience.",
    summary: "Find reliable growers, aggregators and market suppliers for fresh produce supply.",
    details:
      "This role is suited to someone who understands local produce markets, farming communities or aggregation points. You will help identify dependable supply partners, confirm availability, track market prices, support quality checks and keep OneFarmTech updated on what can be sourced reliably in your region.",
    datePosted: "2026-07-09",
  },
  {
    slug: "supplier-partnerships-associate",
    title: "Supplier Partnerships Associate",
    department: "Supply & Procurement",
    stages: ["Full-time", "Part-time", "Contract"],
    locations: ["Lagos", "Abuja", "Plateau", "Benue", "Kaduna", "Kano", "Rivers", "Enugu", "Cross River"],
    qualification: "HND, degree or practical experience working with suppliers, cooperatives, farms or aggregators.",
    summary: "Build and manage relationships with farms, cooperatives, aggregators and supply partners.",
    details:
      "You will help onboard supply partners, collect key supplier information, understand capacity, agree communication routines and maintain reliability records. The role requires good judgement, trust-building and the ability to spot suppliers who can consistently meet buyer expectations.",
    datePosted: "2026-07-09",
  },
  {
    slug: "produce-quality-reliability-officer",
    title: "Produce Quality & Reliability Officer",
    department: "Supply & Procurement",
    stages: ["Full-time", "Part-time", "Contract", "NYSC"],
    locations: ["Lagos", "Abuja", "Port Harcourt", "Jos", "Plateau", "Benue", "Kaduna", "Kano"],
    qualification: "OND, HND, degree or practical experience in food handling, quality control, warehouse, logistics or agriculture.",
    summary: "Help maintain produce quality before, during and after fulfilment.",
    details:
      "You will record quality issues, support grading, flag unreliable suppliers, follow up on rejected items and help reduce buyer complaints. This role is important for keeping trust between buyers, suppliers and OneFarmTech.",
    datePosted: "2026-07-09",
  },
  {
    slug: "buyer-growth-associate",
    title: "Buyer Growth Associate",
    department: "Sales & Buyer Growth",
    stages: ["Full-time", "Part-time", "Contract", "NYSC", "Internship"],
    locations: ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Onitsha", "Kano", "Kaduna"],
    qualification: "OND, HND, degree or strong sales, customer service or field marketing experience.",
    summary: "Introduce OneFarmTech to restaurants, caterers, food vendors, retailers and buying groups.",
    details:
      "You will speak with prospective buyers, understand their produce needs, explain how ordering works and help convert interest into repeat orders. This role is best for confident communicators who are comfortable with outreach, follow-up and relationship building.",
    datePosted: "2026-07-09",
  },
  {
    slug: "key-accounts-executive",
    title: "Key Accounts Executive",
    department: "Sales & Buyer Growth",
    stages: ["Full-time", "Contract"],
    locations: ["Lagos", "Abuja", "Port Harcourt"],
    qualification: "HND, degree or proven B2B sales, account management, hospitality supply or FMCG experience.",
    summary: "Manage larger recurring buyers and high-value food supply relationships.",
    details:
      "You will work with restaurants, hotels, caterers, corporate kitchens and larger recurring buyers. The role involves managing buyer expectations, supporting repeat orders, tracking account needs and helping OneFarmTech become a reliable supply partner.",
    datePosted: "2026-07-09",
  },
  {
    slug: "order-fulfilment-coordinator",
    title: "Order Fulfilment Coordinator",
    department: "Operations & Fulfilment",
    stages: ["Full-time", "Part-time", "NYSC"],
    locations: ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Kano", "Kaduna"],
    qualification: "OND, HND, degree or logistics, dispatch, warehouse or customer operations experience.",
    summary: "Coordinate confirmed orders from allocation through dispatch and delivery follow-up.",
    details:
      "You will help track order readiness, coordinate with internal teams and delivery partners, update buyers, collect delivery evidence and follow up on issues. The role requires calm execution, attention to detail and strong communication.",
    datePosted: "2026-07-09",
  },
  {
    slug: "payments-reconciliation-officer",
    title: "Payments & Reconciliation Officer",
    department: "Finance & Admin",
    stages: ["Full-time", "Part-time", "NYSC"],
    locations: ["Remote", "Lagos", "Abuja"],
    qualification: "OND, HND, degree or practical bookkeeping, finance admin, payment tracking or reconciliation experience.",
    summary: "Keep payment requests, receipts and buyer balances accurate.",
    details:
      "You will help track payment requests, manual transfers, online payment references, receipts and buyer balances. This role requires accuracy, patience and comfort working with spreadsheets, admin systems and payment evidence.",
    datePosted: "2026-07-09",
  },
  {
    slug: "operations-data-associate",
    title: "Operations & Data Associate",
    department: "Finance & Admin",
    stages: ["Full-time", "Part-time", "Internship", "NYSC"],
    locations: ["Remote", "Lagos", "Abuja"],
    qualification: "HND, degree or strong spreadsheet, data entry, reporting or operations admin skills.",
    summary: "Support clean operating records, weekly reporting and internal follow-up.",
    details:
      "You will help maintain order data, buyer records, supplier notes, fulfilment logs and performance reports. This role suits someone organised, numerate and comfortable turning messy operational information into usable records.",
    datePosted: "2026-07-09",
  },
  {
    slug: "product-engineer",
    title: "Product Engineer",
    department: "Technology",
    stages: ["Full-time", "Part-time", "Contract", "Internship"],
    locations: ["Remote", "Lagos", "Abuja"],
    qualification: "Strong practical engineering ability. Degree not mandatory.",
    summary: "Build and improve the software behind OneFarmTech.",
    details:
      "You may work on the buyer portal, admin tools, payments, WhatsApp workflows, reporting, data models and internal operations systems. We value engineers who care about reliability, clean workflows and how real users actually work.",
    datePosted: "2026-07-09",
  },
  {
    slug: "product-designer-uiux-associate",
    title: "Product Designer / UIUX Associate",
    department: "Technology",
    stages: ["Full-time", "Part-time", "Contract", "Internship"],
    locations: ["Remote", "Lagos", "Abuja"],
    qualification: "Portfolio or practical product/design work preferred. Degree not mandatory.",
    summary: "Design clear, mobile-friendly workflows for buyers, admins and partners.",
    details:
      "You will work on buyer journeys, admin pages, forms, tables, dashboards and reusable product patterns. This role is for designers who care about clarity, accessibility and operational products, not only beautiful screens.",
    datePosted: "2026-07-09",
  },
  {
    slug: "digital-content-video-intern",
    title: "Digital Content & Video Intern",
    department: "Content",
    stages: ["Internship", "NYSC", "Part-time"],
    locations: ["Remote", "Lagos", "Abuja", "Jos", "Plateau", "Campus-based"],
    qualification: "Student, graduate or NYSC member. Media, theatre arts, communications, agriculture or business backgrounds welcome.",
    summary: "Create practical content around markets, growers, buyers and food supply.",
    details:
      "You will support short videos, market visits, buyer stories, grower stories, social posts and simple product explainers. A good eye, consistency, editing discipline and storytelling ability matter more than formal experience.",
    datePosted: "2026-07-09",
  },
  {
    slug: "community-field-marketing-associate",
    title: "Community & Field Marketing Associate",
    department: "Community",
    stages: ["Part-time", "Contract", "NYSC", "Internship"],
    locations: ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Onitsha", "Kano", "Kaduna", "Jos"],
    qualification: "No degree required where local network, communication and reliability are strong.",
    summary: "Build local awareness with buyers, neighbourhoods, offices and food communities.",
    details:
      "You will help introduce OneFarmTech to local buyer communities, support simple field activations, gather buyer feedback and connect interested groups to the ordering process. This role suits people who are trusted locally and can communicate clearly.",
    datePosted: "2026-07-09",
  },
  {
    slug: "regional-sales-associate-jos-benue-kano",
    title: "Regional Sales Associate — Jos, Benue & Kano",
    department: "Sales & Buyer Growth",
    stages: ["Full-time", "Part-time", "Contract", "NYSC"],
    locations: ["Jos", "Plateau", "Benue", "Kano"],
    qualification: "OND, HND, degree or strong sales, customer service or field marketing experience in the region.",
    summary: "Win and grow buyer relationships for restaurants, retailers and households across Jos, Benue and Kano.",
    details:
      "You will identify and approach prospective buyers in your region, explain how WhatsApp ordering works, follow up on interest and turn it into repeat orders. This role is for someone with a strong local network and the confidence to open new buyer relationships from scratch.",
    datePosted: "2026-07-31",
  },
  {
    slug: "regional-supplier-relations-associate-jos-benue-kano",
    title: "Regional Supplier Relations Associate — Jos, Benue & Kano",
    department: "Supply & Procurement",
    stages: ["Full-time", "Part-time", "Contract", "NYSC"],
    locations: ["Jos", "Plateau", "Benue", "Kano"],
    qualification: "OND, HND, degree or practical experience working with farms, cooperatives or aggregators in the region.",
    summary: "Build and maintain supplier relationships with farms and aggregators across Jos, Benue and Kano.",
    details:
      "You will identify dependable growers and aggregators in your region, agree pricing and supply terms, confirm availability, and maintain the trust and communication routines that keep produce flowing reliably. Strong local knowledge of farming communities matters more than formal qualifications here.",
    datePosted: "2026-07-31",
  },
  {
    slug: "regional-admin-operations-officer-jos-benue-kano",
    title: "Regional Admin & Operations Officer — Jos, Benue & Kano",
    department: "Finance & Admin",
    stages: ["Full-time", "Part-time", "NYSC"],
    locations: ["Jos", "Plateau", "Benue", "Kano"],
    qualification: "OND, HND, degree or practical admin, records or operations support experience.",
    summary: "Keep regional orders, supplier records and buyer follow-up organised across Jos, Benue and Kano.",
    details:
      "You will support the regional sales and supplier teams with accurate records, order tracking, buyer follow-up and basic reporting back to the central operations team. This role suits someone organised, reliable and comfortable coordinating between multiple people in the field.",
    datePosted: "2026-07-31",
  },
];

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Contract: "CONTRACTOR",
  NYSC: "INTERN",
  Internship: "INTERN",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function careerPath(role: CareerRole) {
  return `/careers/${role.slug}`;
}

export function careerRoleBySlug(slug: string) {
  return careerRoles.find((role) => role.slug === slug);
}

export function careerRoleByTitle(title: string) {
  return careerRoles.find((role) => role.title === title);
}

export function jobPostingFor(role: CareerRole) {
  const nonRemoteLocations = role.locations.filter(
    (location) => location !== "Remote" && location !== "Campus-based",
  );
  const isRemote = role.locations.includes("Remote");
  const description = [
    role.summary,
    role.details,
    `Qualification: ${role.qualification}`,
    `Engagement options: ${role.stages.join(", ")}.`,
    `Locations: ${role.locations.join(", ")}.`,
  ]
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: role.title,
    description,
    datePosted: role.datePosted,
    directApply: true,
    url: canonicalUrl(careerPath(role)),
    employmentType: Array.from(
      new Set(role.stages.map((stage) => EMPLOYMENT_TYPE_MAP[stage]).filter(Boolean)),
    ),
    identifier: {
      "@type": "PropertyValue",
      name: "OneFarmTech",
      value: role.slug,
    },
    hiringOrganization: {
      "@type": "Organization",
      name: "OneFarmTech",
      sameAs: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
    },
    ...(isRemote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: {"@type": "Country", name: "Nigeria"},
        }
      : {}),
    ...(nonRemoteLocations.length
      ? {
          jobLocation: nonRemoteLocations.map((location) => ({
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: location,
              addressCountry: "NG",
            },
          })),
        }
      : {}),
  };
}
