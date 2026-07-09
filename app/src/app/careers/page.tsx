import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

type Role = {
  title: string;
  department: string;
  location: string;
  locationGroup: string;
  stage: string;
  type: string;
  qualification: string;
  focus: string;
};

const roles: Role[] = [
  {
    title: "Procurement Field Associate",
    department: "Procurement",
    location: "Plateau / Jos and nearby farming clusters",
    locationGroup: "Grower regions",
    stage: "Entry / Associate",
    type: "Field",
    qualification: "OND, HND, degree or strong local market experience",
    focus: "Source vegetables, potatoes, grains and seasonal produce from growers and aggregators.",
  },
  {
    title: "Middle Belt Sourcing Officer",
    department: "Procurement",
    location: "Benue, Nasarawa, Kogi, Kwara, Niger and Taraba",
    locationGroup: "Grower regions",
    stage: "Associate / Lead",
    type: "Field",
    qualification: "OND, HND, degree, cooperative or produce sourcing experience",
    focus: "Build supply relationships for yam, cassava, maize, soybeans, grains and vegetables.",
  },
  {
    title: "Northern Produce Procurement Lead",
    department: "Procurement",
    location: "Kaduna, Kano, Katsina, Jigawa, Bauchi, Gombe and Adamawa",
    locationGroup: "Grower regions",
    stage: "Lead",
    type: "Field",
    qualification: "HND, degree or 3+ years sourcing/logistics experience",
    focus: "Coordinate sourcing for tomatoes, onions, grains, millet, sorghum, sesame and dry goods.",
  },
  {
    title: "Supplier Reliability Officer",
    department: "Operations",
    location: "Procurement regions and fulfilment hubs",
    locationGroup: "Mixed",
    stage: "Associate",
    type: "Field / Hybrid",
    qualification: "OND, HND, degree or agriculture/food handling experience",
    focus: "Track produce quality, supplier performance, issue logs and corrective actions.",
  },
  {
    title: "Buyer Growth Associate",
    department: "Sales",
    location: "Lagos, Abuja, Port Harcourt, Ibadan, Enugu, Onitsha, Kano and Kaduna",
    locationGroup: "Buyer cities",
    stage: "Entry / Associate",
    type: "City operations",
    qualification: "OND, HND, degree or strong sales/customer experience",
    focus: "Acquire restaurants, hotels, caterers, retailers, food vendors and buying groups.",
  },
  {
    title: "Key Account Executive",
    department: "Sales",
    location: "Lagos, Abuja and Port Harcourt",
    locationGroup: "Buyer cities",
    stage: "Lead",
    type: "City operations",
    qualification: "HND, degree or proven B2B sales experience",
    focus: "Manage larger recurring buyers, repeat orders, account readiness and buyer retention.",
  },
  {
    title: "Fulfilment Coordinator",
    department: "Fulfilment",
    location: "Lagos, Abuja, Port Harcourt and major city hubs",
    locationGroup: "Buyer cities",
    stage: "Associate",
    type: "City operations",
    qualification: "OND, HND, degree or logistics/customer operations experience",
    focus: "Coordinate order allocation, dispatch, delivery evidence and buyer issue follow-up.",
  },
  {
    title: "Payments & Receipts Officer",
    department: "Finance",
    location: "Remote, Lagos or Abuja",
    locationGroup: "Remote / HQ",
    stage: "Associate",
    type: "Remote / Hybrid",
    qualification: "OND, HND, degree or bookkeeping/admin experience",
    focus: "Manage payment requests, receipts, reconciliation and buyer payment evidence.",
  },
  {
    title: "Full-Stack Product Engineer",
    department: "Technology",
    location: "Remote / hybrid",
    locationGroup: "Remote / HQ",
    stage: "Experienced",
    type: "Remote / Hybrid",
    qualification: "Strong Next.js, TypeScript, database and product judgement. Degree not mandatory.",
    focus: "Build buyer portal, admin operations, payments, WhatsApp workflows and internal tools.",
  },
  {
    title: "Product Designer / UIUX Associate",
    department: "Technology",
    location: "Remote / hybrid",
    locationGroup: "Remote / HQ",
    stage: "Associate",
    type: "Remote / Hybrid",
    qualification: "Portfolio preferred. Degree not mandatory.",
    focus: "Design mobile-first buyer flows, admin workflows, design systems and accessibility.",
  },
  {
    title: "Digital Content & Video Intern",
    department: "Content",
    location: "Remote, Lagos, Abuja or campus-based",
    locationGroup: "Internship / NYSC",
    stage: "Internship",
    type: "Internship",
    qualification: "Student or graduate. Media, theatre arts, communications, agriculture or business welcome.",
    focus: "Create short videos, market visits, buyer stories, grower stories and product explainers.",
  },
  {
    title: "NYSC Operations Associate",
    department: "Operations",
    location: "Lagos, Abuja, Jos, Kaduna, Kano, Port Harcourt and other operating cities",
    locationGroup: "Internship / NYSC",
    stage: "NYSC",
    type: "NYSC",
    qualification: "NYSC member with strong reliability and communication skills",
    focus: "Support buyer follow-up, order tracking, supplier mapping, data entry and community operations.",
  },
];

const departments = ["All", ...Array.from(new Set(roles.map((role) => role.department)))];
const locations = ["All", ...Array.from(new Set(roles.map((role) => role.locationGroup)))];
const stages = ["All", ...Array.from(new Set(roles.map((role) => role.stage)))];
const types = ["All", ...Array.from(new Set(roles.map((role) => role.type)))];

function optionHref(key: string, value: string) {
  if (value === "All") return "/careers";
  return `/careers?${key}=${encodeURIComponent(value)}`;
}

export default function CareersPage({
  searchParams,
}: {
  searchParams?: {
    department?: string;
    location?: string;
    stage?: string;
    type?: string;
    sort?: string;
  };
}) {
  const department = searchParams?.department || "All";
  const location = searchParams?.location || "All";
  const stage = searchParams?.stage || "All";
  const type = searchParams?.type || "All";
  const sort = searchParams?.sort || "department";

  const filtered = roles.filter((role) => {
    return (
      (department === "All" || role.department === department) &&
      (location === "All" || role.locationGroup === location) &&
      (stage === "All" || role.stage === stage) &&
      (type === "All" || role.type === type)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "location") return a.locationGroup.localeCompare(b.locationGroup);
    if (sort === "stage") return a.stage.localeCompare(b.stage);
    return a.department.localeCompare(b.department) || a.title.localeCompare(b.title);
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
              Work on food supply that moves.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#405348]">
              Explore roles across procurement, logistics, sales, fulfilment, technology, finance, content, internships and NYSC.
            </p>
          </div>
        </section>

        <section className="sticky top-3 z-20 rounded-[1.5rem] border border-[#102015]/10 bg-white/95 p-4 shadow-[0_18px_48px_rgba(16,23,18,0.08)] backdrop-blur">
          <div className="grid gap-3 lg:grid-cols-5">
            <Filter label="Department" options={departments} queryKey="department" active={department} />
            <Filter label="Location" options={locations} queryKey="location" active={location} />
            <Filter label="Stage" options={stages} queryKey="stage" active={stage} />
            <Filter label="Type" options={types} queryKey="type" active={type} />

            <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#587063]">
              Sort
              <select
                defaultValue={sort}
                className="rounded-xl border border-[#102015]/10 bg-[#fbfff8] px-3 py-2 text-sm font-black normal-case tracking-normal text-[#102015]"
                onChange={undefined}
              >
                <option value="department">Department</option>
                <option value="location">Location</option>
                <option value="stage">Stage</option>
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#102015]/10 pt-3">
            <p className="text-sm font-bold text-[#405348]">
              {sorted.length} role{sorted.length === 1 ? "" : "s"} shown
            </p>
            <Link href="/careers" className="rounded-full border border-[#102015]/10 px-4 py-2 text-xs font-black text-[#102015] hover:bg-[#f3f8ef]">
              Reset filters
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          {sorted.map((role) => (
            <article
              key={role.title}
              className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(16,23,18,0.08)]"
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_0.34fr] lg:items-start">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{role.department}</Badge>
                    <Badge>{role.stage}</Badge>
                    <Badge>{role.type}</Badge>
                  </div>

                  <h2 className="mt-4 text-2xl font-black text-[#102015]">
                    {role.title}
                  </h2>
                  <p className="mt-2 text-sm font-black text-[#1f7a3f]">
                    {role.location}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#405348]">
                    {role.focus}
                  </p>
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

          {!sorted.length ? (
            <div className="rounded-[1.5rem] border border-[#102015]/10 bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-black">No roles match this filter.</h2>
              <p className="mt-2 text-sm text-[#405348]">Reset filters or contact us with your location and area of interest.</p>
            </div>
          ) : null}
        </section>
      </section>

      <PublicFooter />
    </main>
  );
}

function Filter({
  label,
  options,
  queryKey,
  active,
}: {
  label: string;
  options: string[];
  queryKey: string;
  active: string;
}) {
  return (
    <details className="relative">
      <summary className="grid cursor-pointer list-none gap-1 rounded-xl border border-[#102015]/10 bg-[#fbfff8] px-3 py-2">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-[#587063]">
          {label}
        </span>
        <span className="text-sm font-black text-[#102015]">{active}</span>
      </summary>

      <div className="absolute left-0 z-30 mt-2 grid max-h-72 w-full min-w-56 gap-1 overflow-auto rounded-2xl border border-[#102015]/10 bg-white p-2 shadow-2xl">
        {options.map((option) => (
          <Link
            key={`${queryKey}-${option}`}
            href={optionHref(queryKey, option)}
            className={`rounded-xl px-3 py-2 text-sm font-black ${
              active === option
                ? "bg-[#1f7a3f] text-white"
                : "text-[#102015] hover:bg-[#f3f8ef]"
            }`}
          >
            {option}
          </Link>
        ))}
      </div>
    </details>
  );
}

function Badge({children}: {children: string}) {
  return (
    <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#1f7a3f]">
      {children}
    </span>
  );
}
