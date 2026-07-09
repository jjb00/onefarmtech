import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

const roleGroups = [
  {
    department: "Procurement & Grower Network",
    summary: "Source quality produce, onboard growers and coordinate supply from farming regions.",
    roles: [
      {
        title: "Procurement Field Associate — Plateau / Jos",
        location: "Jos, Barkin Ladi, Bokkos, Mangu and nearby farming clusters",
        focus: "Vegetables, potatoes, fruits, grains, grower relationships and quality checks.",
        qualification: "OND, HND, degree or strong field experience.",
      },
      {
        title: "Middle Belt Sourcing Officer",
        location: "Benue, Nasarawa, Kogi, Kwara, Niger and Taraba",
        focus: "Yam, cassava, maize, soybeans, grains, vegetables and seasonal produce aggregation.",
        qualification: "OND, HND, degree, cooperative experience or local market experience.",
      },
      {
        title: "Northern Produce Procurement Lead",
        location: "Kaduna, Kano, Katsina, Jigawa, Bauchi, Gombe, Adamawa and Borno",
        focus: "Tomatoes, onions, grains, millet, sorghum, sesame, groundnuts, livestock-linked produce and dry goods.",
        qualification: "HND, degree or 3+ years sourcing/logistics experience.",
      },
      {
        title: "South & East Supply Partner Associate",
        location: "Cross River, Rivers, Delta, Edo, Enugu, Anambra, Imo and Abia",
        focus: "Plantain, cassava, palm produce, fish, fruits, vegetables and regional supplier partnerships.",
        qualification: "OND, HND, degree or relevant market/supplier experience.",
      },
    ],
  },
  {
    department: "Sales, Buyer Growth & Fulfilment",
    summary: "Win and support buyers in major consumption cities and trading hubs.",
    roles: [
      {
        title: "Buyer Growth Associate",
        location: "Lagos, Abuja, Port Harcourt, Ibadan, Enugu, Onitsha, Kano and Kaduna",
        focus: "Restaurants, hotels, caterers, food vendors, retailers, households and buying groups.",
        qualification: "OND, HND, degree or strong sales/customer experience.",
      },
      {
        title: "Fulfilment Coordinator",
        location: "Lagos, Abuja, Port Harcourt and major city hubs",
        focus: "Order allocation, dispatch follow-up, delivery evidence and buyer issue resolution.",
        qualification: "OND, HND, degree or logistics/customer operations experience.",
      },
      {
        title: "Group Buy Community Lead",
        location: "Cities, estates, offices, churches, schools and neighbourhood clusters",
        focus: "Organise group-buy windows, collect buyer interest and support community orders.",
        qualification: "No degree required where community reach and reliability are strong.",
      },
      {
        title: "Key Account Executive",
        location: "Lagos, Abuja and Port Harcourt",
        focus: "Restaurants, hotels, corporate kitchens, caterers and large recurring buyers.",
        qualification: "HND, degree or proven B2B sales experience.",
      },
    ],
  },
  {
    department: "Operations, Finance & Risk",
    summary: "Keep payments, receipts, buyer accounts, supplier reliability and controls tight.",
    roles: [
      {
        title: "Payments & Receipts Officer",
        location: "Remote / Lagos / Abuja",
        focus: "Payment requests, Paystack/Flutterwave follow-up, receipts, reconciliation and buyer evidence.",
        qualification: "OND, HND, degree or bookkeeping/admin experience.",
      },
      {
        title: "Operations Analyst",
        location: "Remote / Lagos / Abuja",
        focus: "Order data, fulfilment metrics, buyer behaviour, supplier performance and reporting.",
        qualification: "HND, degree or strong spreadsheet/data skills.",
      },
      {
        title: "Quality & Supplier Reliability Officer",
        location: "Procurement regions and fulfilment hubs",
        focus: "Produce quality checks, supplier scoring, issue logs and corrective actions.",
        qualification: "OND, HND, degree or agriculture/food handling experience.",
      },
    ],
  },
  {
    department: "Technology, Product & Data",
    summary: "Build and improve the operating system behind OneFarmTech.",
    roles: [
      {
        title: "Full-Stack Product Engineer",
        location: "Remote / hybrid",
        focus: "Buyer portal, admin operations, payments, WhatsApp workflows and internal tools.",
        qualification: "Degree not mandatory. Strong Next.js, TypeScript, database and product judgement required.",
      },
      {
        title: "Product Designer / UIUX Associate",
        location: "Remote / hybrid",
        focus: "Mobile-first buyer flows, admin workflows, design systems and accessibility.",
        qualification: "Portfolio preferred. Degree not mandatory.",
      },
      {
        title: "Data & Automation Associate",
        location: "Remote / hybrid",
        focus: "Dashboards, data quality, workflow automation, buyer segmentation and operational reporting.",
        qualification: "HND, degree, bootcamp or strong practical data skills.",
      },
    ],
  },
  {
    department: "Content, Community & Internships",
    summary: "Tell the story, support users and build talent pipelines.",
    roles: [
      {
        title: "Digital Content & Video Intern",
        location: "Remote / Lagos / Abuja / campus-based",
        focus: "Short videos, market visits, buyer stories, grower stories, social content and product explainers.",
        qualification: "Student or graduate. Theatre arts, media, communications, agriculture or business backgrounds welcome.",
      },
      {
        title: "NYSC Operations Associate",
        location: "Lagos, Abuja, Jos, Kaduna, Kano, Port Harcourt and other operating cities",
        focus: "Buyer support, order follow-up, supplier mapping, data entry and community operations.",
        qualification: "NYSC member with strong reliability and communication skills.",
      },
      {
        title: "Agribusiness Research Intern",
        location: "Remote / field-based",
        focus: "Map crop clusters, markets, suppliers, logistics routes and buyer demand.",
        qualification: "Student, graduate, NYSC or practical field researcher.",
      },
    ],
  },
];

const hiringNotes = [
  "Field roles can be part-time, full-time, contract, internship or NYSC depending on location.",
  "Local language, market knowledge and reliability can be more important than formal qualifications for some field roles.",
  "Tech, finance and data roles require stronger technical accuracy and documentation discipline.",
  "OneFarmTech values people who can work with buyers, growers, suppliers and operators respectfully.",
];

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-[#fbfff8] text-[#102015]">
      <section className="bg-[radial-gradient(circle_at_16%_16%,rgba(242,184,75,0.18),transparent_30%),linear-gradient(180deg,#fbfff8_0%,#f7f5ec_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="Go to OneFarmTech homepage">
              <BrandMark />
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/contact" className="rounded-full border border-[#102015]/10 bg-white px-4 py-2 text-sm font-black text-[#102015]">
                Contact
              </Link>
              <Link href="/" className="rounded-full bg-[#1f7a3f] px-4 py-2 text-sm font-black text-white">
                Home
              </Link>
            </div>
          </header>

          <div className="grid gap-8 py-14 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <p className="inline-flex rounded-full border border-[#1f7a3f]/15 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
                Careers
              </p>
              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                Build the food supply network buyers can rely on.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-[#405348]">
                We work across sourcing, logistics, sales, finance, product, data and community operations. Some roles need degrees. Some need field experience, local knowledge and strong execution.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#102015]/10 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black">Open talent areas</h2>
              <div className="mt-4 grid gap-3">
                {["Procurement", "Logistics", "Sales", "Fulfilment", "Technology", "Finance", "Content", "Internships", "NYSC"].map((item) => (
                  <span key={item} className="rounded-2xl bg-[#f3f8ef] px-4 py-3 text-sm font-black text-[#102015]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:px-10">
        {roleGroups.map((group) => (
          <section key={group.department} className="rounded-[2rem] border border-[#102015]/10 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-[#102015]/10 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black">{group.department}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">{group.summary}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {group.roles.map((role) => (
                <article key={role.title} className="rounded-2xl border border-[#102015]/10 bg-[#fbfff8] p-4">
                  <h3 className="text-lg font-black text-[#102015]">{role.title}</h3>
                  <p className="mt-2 text-sm font-bold text-[#1f7a3f]">{role.location}</p>
                  <p className="mt-3 text-sm leading-7 text-[#405348]">{role.focus}</p>
                  <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#102015]">
                    Qualification: {role.qualification}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-[2rem] border border-[#102015]/10 bg-[#102015] p-6 text-white shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black">Interested in working with OneFarmTech?</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                Send a short note with your location, role interest, experience and availability.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/contact" className="rounded-full bg-[#F2B84B] px-5 py-3 text-sm font-black text-[#102015]">
                Contact us
              </Link>
              <a
                href="https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20am%20interested%20in%20a%20career%20or%20internship%20role.%20My%20location%20is%3A%20___"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-white hover:bg-white/10"
              >
                Message on WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          {hiringNotes.map((note) => (
            <div key={note} className="rounded-2xl border border-[#102015]/10 bg-white p-4 text-sm font-semibold leading-7 text-[#405348] shadow-sm">
              {note}
            </div>
          ))}
        </section>
      </section>

      <PublicFooter />
    </main>
  );
}
