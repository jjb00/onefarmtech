import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

type Role = {
  title: string;
  department: string;
  stage: string;
  locationLabel: string;
  locations: string[];
  qualification: string;
  summary: string;
  details: string[];
};

const roles: Role[] = [
  {
    title: "Procurement Field Associate",
    department: "Procurement",
    stage: "Entry / Associate",
    locationLabel: "Plateau / Jos, Middle Belt and selected grower clusters",
    locations: ["Plateau", "Jos", "Benue", "Nasarawa", "Kogi", "Kwara", "Niger", "Taraba"],
    qualification: "OND, HND, degree or strong field/market experience.",
    summary: "Source quality produce and build reliable grower and aggregator relationships.",
    details: [
      "Work with growers, aggregators, cooperatives and local markets.",
      "Support price checks, availability updates, quality notes and pickup coordination.",
      "Relevant produce includes vegetables, potatoes, yam, cassava, maize, soybeans, grains and seasonal crops.",
    ],
  },
  {
    title: "Northern Produce Procurement Lead",
    department: "Procurement",
    stage: "Lead",
    locationLabel: "Kaduna, Kano, Katsina, Jigawa, Bauchi, Gombe, Adamawa and Borno",
    locations: ["Kaduna", "Kano", "Katsina", "Jigawa", "Bauchi", "Gombe", "Adamawa", "Borno"],
    qualification: "HND, degree or 3+ years sourcing, aggregation or logistics experience.",
    summary: "Coordinate supplier relationships, produce movement and quality checks across Northern supply clusters.",
    details: [
      "Focus on tomatoes, onions, grains, millet, sorghum, sesame, groundnuts and dry goods.",
      "Own supplier relationships, pickup readiness, price intelligence and reliability notes.",
      "Best suited to someone with existing market, farmer, transport or commodity relationships.",
    ],
  },
  {
    title: "South & East Supply Partner Associate",
    department: "Procurement",
    stage: "Associate",
    locationLabel: "Cross River, Rivers, Delta, Edo, Enugu, Anambra, Imo and Abia",
    locations: ["Cross River", "Rivers", "Delta", "Edo", "Enugu", "Anambra", "Imo", "Abia"],
    qualification: "OND, HND, degree or relevant supplier/market experience.",
    summary: "Support supplier partnerships across South and East produce corridors.",
    details: [
      "Focus on plantain, cassava, palm produce, fish, fruits, vegetables and regional supply partners.",
      "Identify dependable producers, processors, market suppliers and logistics partners.",
      "Good fit for candidates with strong local networks and practical operating discipline.",
    ],
  },
  {
    title: "Supplier Quality & Reliability Officer",
    department: "Operations",
    stage: "Associate",
    locationLabel: "Procurement regions and fulfilment hubs",
    locations: ["Plateau", "Benue", "Nasarawa", "Kogi", "Kwara", "Niger", "Taraba", "Lagos", "Abuja", "Port Harcourt"],
    qualification: "OND, HND, degree or agriculture/food handling experience.",
    summary: "Track supplier reliability, produce quality, issue history and corrective actions.",
    details: [
      "Record quality issues before they become buyer complaints.",
      "Support grading, rejection notes, supplier scorecards and follow-up actions.",
      "Useful for candidates with warehouse, food handling, agriculture, logistics or quality-control exposure.",
    ],
  },
  {
    title: "Buyer Growth Associate",
    department: "Sales",
    stage: "Entry / Associate",
    locationLabel: "Lagos, Abuja, Port Harcourt, Ibadan, Enugu, Onitsha, Kano and Kaduna",
    locations: ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Onitsha", "Kano", "Kaduna"],
    qualification: "OND, HND, degree or strong sales/customer experience.",
    summary: "Acquire and support buyers in high-consumption cities.",
    details: [
      "Work with restaurants, hotels, caterers, food vendors, retailers, households and buying groups.",
      "Help buyers understand product availability, pricing, ordering and account setup.",
      "Good fit for confident communicators with sales drive and strong follow-through.",
    ],
  },
  {
    title: "Key Account Executive",
    department: "Sales",
    stage: "Lead",
    locationLabel: "Lagos, Abuja and Port Harcourt",
    locations: ["Lagos", "Abuja", "Port Harcourt"],
    qualification: "HND, degree or proven B2B sales/account management experience.",
    summary: "Manage larger recurring buyers and high-value food supply accounts.",
    details: [
      "Own relationships with restaurants, hotels, corporate kitchens, caterers and large recurring buyers.",
      "Support account readiness, repeat orders, buyer retention and payment follow-up.",
      "Best suited to candidates with B2B sales, hospitality supply, FMCG or foodservice experience.",
    ],
  },
  {
    title: "Fulfilment Coordinator",
    department: "Fulfilment",
    stage: "Associate",
    locationLabel: "Lagos, Abuja, Port Harcourt and major city hubs",
    locations: ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Kano", "Kaduna"],
    qualification: "OND, HND, degree or logistics/customer operations experience.",
    summary: "Coordinate order allocation, dispatch follow-up and buyer delivery support.",
    details: [
      "Track orders from confirmation through dispatch, delivery evidence and issue resolution.",
      "Work with buyers, delivery partners and internal operations to reduce failed fulfilment.",
      "Good fit for organised candidates with logistics, dispatch, warehouse or customer support experience.",
    ],
  },
  {
    title: "Payments & Receipts Officer",
    department: "Finance",
    stage: "Associate",
    locationLabel: "Remote, Lagos or Abuja",
    locations: ["Remote", "Lagos", "Abuja"],
    qualification: "OND, HND, degree or bookkeeping/admin experience.",
    summary: "Manage payment requests, receipts, evidence and reconciliation support.",
    details: [
      "Track payment requests, manual transfers, Paystack/Flutterwave references and receipt status.",
      "Support buyer balances, payment evidence and internal finance records.",
      "Good fit for careful operators with bookkeeping, admin, finance or reconciliation exposure.",
    ],
  },
  {
    title: "Operations Analyst",
    department: "Operations",
    stage: "Associate",
    locationLabel: "Remote, Lagos or Abuja",
    locations: ["Remote", "Lagos", "Abuja"],
    qualification: "HND, degree or strong spreadsheet/data skills.",
    summary: "Turn operational data into useful reporting and decisions.",
    details: [
      "Track orders, fulfilment, buyer behaviour, supplier performance and product movement.",
      "Support dashboards, weekly reporting, data quality checks and operating reviews.",
      "Good fit for spreadsheet-heavy candidates with attention to detail and commercial curiosity.",
    ],
  },
  {
    title: "Product Engineer",
    department: "Technology",
    stage: "Experienced",
    locationLabel: "Remote / hybrid",
    locations: ["Remote", "Lagos", "Abuja"],
    qualification: "Strong Next.js, TypeScript, database and product judgement. Degree not mandatory.",
    summary: "Build and improve the operating system behind OneFarmTech.",
    details: [
      "Work on buyer portal, admin workflows, payments, WhatsApp operations, reporting and internal tools.",
      "Own product-quality details across mobile UX, reliability, data integrity and operational workflows.",
      "Best suited to engineers who can think like product, operations and customer support at the same time.",
    ],
  },
  {
    title: "Product Designer / UIUX Associate",
    department: "Technology",
    stage: "Associate",
    locationLabel: "Remote / hybrid",
    locations: ["Remote", "Lagos", "Abuja"],
    qualification: "Portfolio preferred. Degree not mandatory.",
    summary: "Design clean mobile-first workflows for buyers, admins and partners.",
    details: [
      "Work on buyer ordering, admin operations, forms, tables, dashboards and reusable product patterns.",
      "Improve clarity, accessibility, mobile usability and consistency across the platform.",
      "Good fit for designers who care about operational products, not only landing pages.",
    ],
  },
  {
    title: "Content & Community Intern",
    department: "Content",
    stage: "Internship",
    locationLabel: "Remote, Lagos, Abuja, Jos or campus-based",
    locations: ["Remote", "Lagos", "Abuja", "Jos", "Plateau"],
    qualification: "Student or graduate. Media, theatre arts, communications, agriculture or business backgrounds welcome.",
    summary: "Create practical content around markets, growers, buyers and food supply.",
    details: [
      "Produce short videos, market visits, buyer stories, grower stories, social content and product explainers.",
      "Good fit for theatre arts, media, communications, creative, agriculture or business students.",
      "Editing, storytelling, phone-shot content and consistency matter more than formal experience.",
    ],
  },
  {
    title: "NYSC Operations Associate",
    department: "Operations",
    stage: "NYSC",
    locationLabel: "Lagos, Abuja, Jos, Kaduna, Kano, Port Harcourt and other operating cities",
    locations: ["Lagos", "Abuja", "Jos", "Plateau", "Kaduna", "Kano", "Port Harcourt"],
    qualification: "NYSC member with strong reliability and communication skills.",
    summary: "Support buyer follow-up, order tracking, supplier mapping and field operations.",
    details: [
      "Work across buyer support, order follow-up, data entry, supplier mapping and community operations.",
      "Useful for NYSC members who want practical startup, agribusiness and operations experience.",
      "Strong communication, reliability and ownership are more important than course of study.",
    ],
  },
];

const departments = ["All", ...Array.from(new Set(roles.map((role) => role.department)))];
const stages = ["All", ...Array.from(new Set(roles.map((role) => role.stage)))];
const locations = ["All", ...Array.from(new Set(roles.flatMap((role) => role.locations)))].sort((a, b) => {
  if (a === "All") return -1;
  if (b === "All") return 1;
  return a.localeCompare(b);
});

export default async function CareersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    department?: string;
    location?: string;
    stage?: string;
  }>;
}) {
  const params = await searchParams;

  const department = params?.department || "All";
  const location = params?.location || "All";
  const stage = params?.stage || "All";

  const filtered = roles.filter((role) => {
    return (
      (department === "All" || role.department === department) &&
      (location === "All" || role.locations.includes(location)) &&
      (stage === "All" || role.stage === stage)
    );
  });

  return (
    <main className="oft-product-shell min-h-screen bg-[#fbfff8] text-[#102015]">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Go to OneFarmTech homepage">
            <BrandMark />
          </Link>
          <Link
            href="/contact"
            className="rounded-full bg-[#1f7a3f] px-4 py-2 text-sm font-black text-white shadow-sm"
          >
            Contact
          </Link>
        </header>

        <section className="py-12">
          <div className="max-w-4xl">
            <p className="inline-flex rounded-full border border-[#1f7a3f]/15 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
              Careers
            </p>
            <h1 className="mt-6 text-5xl font-black tracking-tight md:text-7xl">
              Help build a stronger food supply network.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#405348]">
              Explore roles across procurement, logistics, sales, fulfilment,
              finance, technology, content, internships and NYSC.
            </p>
          </div>
        </section>

        <form
          action="/careers"
          className="rounded-[1.5rem] border border-[#102015]/10 bg-white/95 p-4 shadow-[0_18px_48px_rgba(16,23,18,0.08)] backdrop-blur"
        >
          <div className="grid gap-3 lg:grid-cols-3">
            <FilterSelect label="Department" name="department" value={department} options={departments} />
            <FilterSelect label="Location" name="location" value={location} options={locations} />
            <FilterSelect label="Stage" name="stage" value={stage} options={stages} />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#102015]/10 pt-3">
            <p className="text-sm font-bold text-[#405348]">
              {filtered.length} role{filtered.length === 1 ? "" : "s"} shown
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/careers"
                className="rounded-full border border-[#102015]/10 px-4 py-2 text-xs font-black text-[#102015] hover:bg-[#f3f8ef]"
              >
                Reset
              </Link>
              <button
                type="submit"
                className="rounded-full bg-[#1f7a3f] px-4 py-2 text-xs font-black text-white"
              >
                Apply filters
              </button>
            </div>
          </div>
        </form>

        <section className="mt-6 grid gap-4">
          {filtered.map((role) => (
            <article
              key={`${role.title}-${role.locationLabel}`}
              className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(16,23,18,0.08)]"
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_0.34fr] lg:items-start">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{role.department}</Badge>
                    <Badge>{role.stage}</Badge>
                  </div>

                  <h2 className="mt-4 text-2xl font-black text-[#102015]">
                    {role.title}
                  </h2>
                  <p className="mt-2 text-sm font-black text-[#1f7a3f]">
                    {role.locationLabel}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#405348]">
                    {role.summary}
                  </p>

                  <details className="mt-4 rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4">
                    <summary className="cursor-pointer text-sm font-black text-[#102015]">
                      Role details
                    </summary>
                    <ul className="mt-3 grid gap-2 text-sm leading-7 text-[#405348]">
                      {role.details.map((detail) => (
                        <li key={detail}>• {detail}</li>
                      ))}
                    </ul>
                  </details>
                </div>

                <div className="rounded-2xl bg-[#f3f8ef] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#587063]">
                    Qualification
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#102015]">
                    {role.qualification}
                  </p>
                  <Link
                    href={`/contact?role=${encodeURIComponent(role.title)}`}
                    className="mt-4 inline-flex rounded-full bg-[#1f7a3f] px-4 py-2 text-xs font-black text-white"
                  >
                    Express interest
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {!filtered.length ? (
            <div className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-black">No roles match this filter.</h2>
              <p className="mt-2 text-sm text-[#405348]">
                Reset filters or contact us with your location and area of interest.
              </p>
            </div>
          ) : null}
        </section>
      </section>

      <PublicFooter />
    </main>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
}) {
  return (
    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#587063]">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="rounded-xl border border-[#102015]/10 bg-[#fbfff8] px-3 py-2 text-sm font-black normal-case tracking-normal text-[#102015]"
      >
        {options.map((option) => (
          <option key={`${name}-${option}`} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Badge({children}: {children: string}) {
  return (
    <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#1f7a3f]">
      {children}
    </span>
  );
}
