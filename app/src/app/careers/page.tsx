import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

type Role = {
  title: string;
  department: string;
  stages: string[];
  locations: string[];
  qualification: string;
  summary: string;
  details: string;
};

const roles: Role[] = [
  {
    title: "Produce Sourcing Associate",
    department: "Supply & Procurement",
    stages: ["Full-time", "Part-time", "Contract", "NYSC"],
    locations: ["Plateau", "Jos", "Benue", "Nasarawa", "Kogi", "Kwara", "Niger", "Taraba", "Kaduna", "Kano"],
    qualification: "OND, HND, degree or strong produce-market experience.",
    summary: "Find reliable growers, aggregators and market suppliers for fresh produce supply.",
    details:
      "This role is suited to someone who understands local produce markets, farming communities or aggregation points. You will help identify dependable supply partners, confirm availability, track market prices, support quality checks and keep OneFarmTech updated on what can be sourced reliably in your region.",
  },
  {
    title: "Supplier Partnerships Associate",
    department: "Supply & Procurement",
    stages: ["Full-time", "Part-time", "Contract"],
    locations: ["Lagos", "Abuja", "Plateau", "Benue", "Kaduna", "Kano", "Rivers", "Enugu", "Cross River"],
    qualification: "HND, degree or practical experience working with suppliers, cooperatives, farms or aggregators.",
    summary: "Build and manage relationships with farms, cooperatives, aggregators and supply partners.",
    details:
      "You will help onboard supply partners, collect key supplier information, understand capacity, agree communication routines and maintain reliability records. The role requires good judgement, trust-building and the ability to spot suppliers who can consistently meet buyer expectations.",
  },
  {
    title: "Produce Quality & Reliability Officer",
    department: "Supply & Procurement",
    stages: ["Full-time", "Part-time", "Contract", "NYSC"],
    locations: ["Lagos", "Abuja", "Port Harcourt", "Jos", "Plateau", "Benue", "Kaduna", "Kano"],
    qualification: "OND, HND, degree or practical experience in food handling, quality control, warehouse, logistics or agriculture.",
    summary: "Help maintain produce quality before, during and after fulfilment.",
    details:
      "You will record quality issues, support grading, flag unreliable suppliers, follow up on rejected items and help reduce buyer complaints. This role is important for keeping trust between buyers, suppliers and OneFarmTech.",
  },
  {
    title: "Buyer Growth Associate",
    department: "Sales & Buyer Growth",
    stages: ["Full-time", "Part-time", "Contract", "NYSC", "Internship"],
    locations: ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Onitsha", "Kano", "Kaduna"],
    qualification: "OND, HND, degree or strong sales, customer service or field marketing experience.",
    summary: "Introduce OneFarmTech to restaurants, caterers, food vendors, retailers and buying groups.",
    details:
      "You will speak with prospective buyers, understand their produce needs, explain how ordering works and help convert interest into repeat orders. This role is best for confident communicators who are comfortable with outreach, follow-up and relationship building.",
  },
  {
    title: "Key Accounts Executive",
    department: "Sales & Buyer Growth",
    stages: ["Full-time", "Contract"],
    locations: ["Lagos", "Abuja", "Port Harcourt"],
    qualification: "HND, degree or proven B2B sales, account management, hospitality supply or FMCG experience.",
    summary: "Manage larger recurring buyers and high-value food supply relationships.",
    details:
      "You will work with restaurants, hotels, caterers, corporate kitchens and larger recurring buyers. The role involves managing buyer expectations, supporting repeat orders, tracking account needs and helping OneFarmTech become a reliable supply partner.",
  },
  {
    title: "Order Fulfilment Coordinator",
    department: "Operations & Fulfilment",
    stages: ["Full-time", "Part-time", "NYSC"],
    locations: ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Kano", "Kaduna"],
    qualification: "OND, HND, degree or logistics, dispatch, warehouse or customer operations experience.",
    summary: "Coordinate confirmed orders from allocation through dispatch and delivery follow-up.",
    details:
      "You will help track order readiness, coordinate with internal teams and delivery partners, update buyers, collect delivery evidence and follow up on issues. The role requires calm execution, attention to detail and strong communication.",
  },
  {
    title: "Payments & Reconciliation Officer",
    department: "Finance & Admin",
    stages: ["Full-time", "Part-time", "NYSC"],
    locations: ["Remote", "Lagos", "Abuja"],
    qualification: "OND, HND, degree or practical bookkeeping, finance admin, payment tracking or reconciliation experience.",
    summary: "Keep payment requests, receipts and buyer balances accurate.",
    details:
      "You will help track payment requests, manual transfers, online payment references, receipts and buyer balances. This role requires accuracy, patience and comfort working with spreadsheets, admin systems and payment evidence.",
  },
  {
    title: "Operations & Data Associate",
    department: "Finance & Admin",
    stages: ["Full-time", "Part-time", "Internship", "NYSC"],
    locations: ["Remote", "Lagos", "Abuja"],
    qualification: "HND, degree or strong spreadsheet, data entry, reporting or operations admin skills.",
    summary: "Support clean operating records, weekly reporting and internal follow-up.",
    details:
      "You will help maintain order data, buyer records, supplier notes, fulfilment logs and performance reports. This role suits someone organised, numerate and comfortable turning messy operational information into usable records.",
  },
  {
    title: "Product Engineer",
    department: "Technology",
    stages: ["Full-time", "Part-time", "Contract", "Internship"],
    locations: ["Remote", "Lagos", "Abuja"],
    qualification: "Strong practical engineering ability. Degree not mandatory.",
    summary: "Build and improve the software behind OneFarmTech.",
    details:
      "You may work on the buyer portal, admin tools, payments, WhatsApp workflows, reporting, data models and internal operations systems. We value engineers who care about reliability, clean workflows and how real users actually work.",
  },
  {
    title: "Product Designer / UIUX Associate",
    department: "Technology",
    stages: ["Full-time", "Part-time", "Contract", "Internship"],
    locations: ["Remote", "Lagos", "Abuja"],
    qualification: "Portfolio or practical product/design work preferred. Degree not mandatory.",
    summary: "Design clear, mobile-friendly workflows for buyers, admins and partners.",
    details:
      "You will work on buyer journeys, admin pages, forms, tables, dashboards and reusable product patterns. This role is for designers who care about clarity, accessibility and operational products, not only beautiful screens.",
  },
  {
    title: "Digital Content & Video Intern",
    department: "Content",
    stages: ["Internship", "NYSC", "Part-time"],
    locations: ["Remote", "Lagos", "Abuja", "Jos", "Plateau", "Campus-based"],
    qualification: "Student, graduate or NYSC member. Media, theatre arts, communications, agriculture or business backgrounds welcome.",
    summary: "Create practical content around markets, growers, buyers and food supply.",
    details:
      "You will support short videos, market visits, buyer stories, grower stories, social posts and simple product explainers. A good eye, consistency, editing discipline and storytelling ability matter more than formal experience.",
  },
  {
    title: "Community & Field Marketing Associate",
    department: "Community",
    stages: ["Part-time", "Contract", "NYSC", "Internship"],
    locations: ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Onitsha", "Kano", "Kaduna", "Jos"],
    qualification: "No degree required where local network, communication and reliability are strong.",
    summary: "Build local awareness with buyers, neighbourhoods, offices and food communities.",
    details:
      "You will help introduce OneFarmTech to local buyer communities, support simple field activations, gather buyer feedback and connect interested groups to the ordering process. This role suits people who are trusted locally and can communicate clearly.",
  },
];

const departments = ["All", ...Array.from(new Set(roles.map((role) => role.department)))];
const stages = ["All", ...Array.from(new Set(roles.flatMap((role) => role.stages)))];
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
      (stage === "All" || role.stages.includes(stage))
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
              Work with us to improve fresh food supply.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#405348]">
              Explore practical roles across supply, sales, fulfilment, finance,
              technology, content and community.
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
              key={role.title}
              className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(16,23,18,0.08)]"
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_0.34fr] lg:items-start">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{role.department}</Badge>
                    {role.stages.slice(0, 3).map((item) => (
                      <Badge key={`${role.title}-${item}`}>{item}</Badge>
                    ))}
                  </div>

                  <h2 className="mt-4 text-2xl font-black text-[#102015]">
                    {role.title}
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#405348]">
                    {role.summary}
                  </p>

                  <details className="mt-4 rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4">
                    <summary className="cursor-pointer text-sm font-black text-[#102015]">
                      View role details
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-[#405348]">
                      {role.details}
                    </p>
                  </details>
                </div>

                <div className="rounded-2xl bg-[#f3f8ef] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#587063]">
                    Locations
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#102015]">
                    {role.locations.slice(0, 7).join(", ")}
                    {role.locations.length > 7 ? " and others" : ""}
                  </p>

                  <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#587063]">
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
