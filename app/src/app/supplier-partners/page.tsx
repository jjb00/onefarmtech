import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

const partnerTypes = [
  "Farms",
  "Aggregators",
  "Cooperatives",
  "Market suppliers",
  "Processors",
  "Cold-chain partners",
  "Logistics partners",
  "Packaging partners",
];

export default function SupplierPartnersPage() {
  return (
    <main className="min-h-screen bg-[#fbfff8] text-[#102015]">
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Go to OneFarmTech homepage"><BrandMark /></Link>
          <Link href="/contact" className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white">
            Contact
          </Link>
        </header>

        <div className="grid gap-8 py-14 lg:grid-cols-[1fr_0.75fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-[#1f7a3f]/15 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
              Supplier partners
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
              Supply quality produce to serious buyers.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#405348]">
              OneFarmTech works with growers, aggregators and logistics partners who can support reliable fresh food supply.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#102015]/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">Partner types</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {partnerTypes.map((item) => (
                <span key={item} className="rounded-2xl bg-[#f3f8ef] px-4 py-3 text-sm font-black">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">What we look for</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              "Consistent supply or clear seasonal availability",
              "Fair pricing and transparent grading",
              "Reliable communication",
              "Quality control and issue resolution",
              "Ability to fulfil confirmed buyer demand",
              "Clear pickup, delivery or aggregation arrangements",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#f3f8ef] p-4 text-sm font-semibold text-[#405348]">
                {item}
              </div>
            ))}
          </div>
        </section>
      </section>

      <PublicFooter />
    </main>
  );
}
