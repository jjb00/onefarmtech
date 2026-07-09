import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

type Role = {
  title: string;
  department: string;
  locations: string[];
  stages: string[];
  qualification: string;
  summary: string;
  details: string;
};

const roles: Role[] = [
  {
    title: "Supply & Procurement Associate",
    department: "Supply",
    locations: [
      "Plateau",
      "Jos",
      "Benue",
      "Nasarawa",
      "Kogi",
      "Kwara",
      "Niger",
      "Taraba",
      "Kaduna",
      "Kano",
      "Katsina",
      "Jigawa",
      "Bauchi",
      "Gombe",
      "Adamawa",
      "Cross River",
      "Rivers",
      "Delta",
      "Edo",
      "Enugu",
      "Anambra",
      "Imo",
      "Abia",
    ],
    stages: ["Full-time", "Part-time", "Contract", "NYSC", "Internship"],
    qualification:
      "OND, HND, degree, cooperative experience, market experience or strong local produce knowledge.",
    summary:
      "Help OneFarmTech find reliable growers, aggregators and supply partners across key food-producing regions.",
    details:
      "This role is for people who understand food markets, farming communities, aggregation, quality, pricing or local logistics. You may help map suppliers, confirm produce availability, check prices, record quality notes, coordinate pickup readiness and build trusted supply relationships across vegetables, grains, tubers, fruits, fish, livestock-linked produce and seasonal crops.",
  },
  {
    title: "Buyer Growth & Fulfilment Associate",
    department: "Sales & Fulfilment",
    locations: [
      "Lagos",
      "Abuja",
      "Port Harcourt",
      "Ibadan",
      "Enugu",
      "Onitsha",
      "Kano",
      "Kaduna",
    ],
    stages: ["Full-time", "Part-time", "Contract", "NYSC", "Internship"],
    qualification:
      "OND, HND, degree or strong sales, customer service, dispatch, hospitality, retail or foodservice experience.",
    summary:
      "Support buyers from first enquiry through order confirmation, fulfilment, delivery follow-up and repeat purchase.",
    details:
      "This combines buyer growth and fulfilment because, at this stage, the buyer experience cannot be split too early. You may speak with restaurants, hotels, caterers, retailers, offices, food vendors and buying groups; help them understand prices and availability; follow up on orders; coordinate fulfilment updates; and make sure buyers receive clear communication from order to delivery.",
  },
  {
    title: "Finance & Operations Associate",
    department: "Operations",
    locations: ["Remote", "Lagos", "Abuja"],
    stages: ["Full-time", "Part-time", "NYSC", "Internship"],
    qualification:
      "OND, HND, degree or practical experience in admin, bookkeeping, reconciliation, spreadsheets or operations.",
    summary:
      "Keep payment, receipt, order and operating records accurate as the business grows.",
    details:
      "This role supports the operating backbone of OneFarmTech. You may help track payment requests, receipts, buyer balances, order records, supplier notes, fulfilment issues, data quality and weekly reporting. It suits careful people who are organised, numerate and comfortable working with spreadsheets, admin systems and operational follow-up.",
  },
  {
    title: "Product & Technology Associate",
    department: "Technology",
    locations: ["Remote", "Lagos", "Abuja"],
    stages: ["Full-time", "Part-time", "Contract", "Internship"],
    qualification:
      "Degree not mandatory. Practical product, engineering, UIUX, data or automation skill is more important.",
    summary:
      "Help improve the software, workflows and data systems behind OneFarmTech.",
    details:
      "This role family covers product engineering, UIUX, data and automation. Depending on skill level, you may work on the buyer portal, admin workflows, payments, WhatsApp operations, reporting, mobile usability, design systems, internal dashboards or workflow automation. Strong judgement matters because this is an operating product, not only a website.",
  },
  {
    title: "Content, Community & Internship Associate",
    department: "Community",
    locations: ["Remote", "Lagos", "Abuja", "Jos", "Plateau", "Campus-based"],
    stages: ["Internship", "NYSC", "Part-time"],
    qualification:
      "Student, graduate, NYSC member or early-career candidate. Media, theatre arts, agriculture, business and communications backgrounds welcome.",
    summary:
      "Tell practical stories about food supply, markets, growers, buyers and the people behind the network.",
    details:
      "This role is suitable for interns, NYSC members and early-career creatives who can produce useful content and support community activity. Work may include short videos, market visits, buyer stories, grower stories, social posts, product explainers, event support and simple research. A good phone, editing discipline, storytelling ability and consistency can matter more than formal qualifications.",
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
              Help build a stronger food supply network.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#405348]">
              We hire across supply, buyer growth, fulfilment, operations,
              technology and community roles. Some roles need qualifications.
              Others need local knowledge, reliability and strong execution.
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
              {filtered.length} role area{filtered.length === 1 ? "" : "s"} shown
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
              <h2 className="text-2xl font-black">No role areas match this filter.</h2>
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
