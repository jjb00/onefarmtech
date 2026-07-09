import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

const partnerOptions = [
  {
    title: "Delivery partner",
    href: "/delivery-partner/login",
    description: "View assigned jobs, delivery status and fulfilment updates.",
    badge: "Logistics",
  },
  {
    title: "Supplier partner",
    href: "/supplier-partners",
    description: "Register interest as a farm, aggregator, cooperative or supply partner.",
    badge: "Supply",
  },
];

export default function PartnerLoginPage() {
  return (
    <main className="oft-product-shell min-h-screen bg-[#fbfff8] text-[#102015]">
      <section className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Go to OneFarmTech homepage">
            <BrandMark />
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[#102015]/10 bg-white px-4 py-2 text-sm font-black text-[#102015] shadow-sm hover:bg-[#f3f8ef]"
          >
            Home
          </Link>
        </header>

        <div className="py-14">
          <p className="inline-flex rounded-full border border-[#1f7a3f]/15 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
            Partner access
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight md:text-6xl">
            Choose your partner area.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#405348]">
            Delivery partners and supplier partners use different workflows.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {partnerOptions.map((option) => (
              <Link
                key={option.title}
                href={option.href}
                className="oft-premium-card rounded-[2rem] border border-[#102015]/10 bg-white p-6 shadow-sm transition hover:-translate-y-1"
              >
                <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#1f7a3f]">
                  {option.badge}
                </span>
                <h2 className="mt-5 text-2xl font-black text-[#102015]">
                  {option.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#405348]">
                  {option.description}
                </p>
                <span className="mt-6 inline-flex rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white">
                  Continue
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
