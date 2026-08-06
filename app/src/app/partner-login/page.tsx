import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicImageCollage from "@/components/PublicImageCollage";
import PublicFooter from "@/components/PublicFooter";
import {PRIVATE_NOINDEX_METADATA} from "@/lib/publicSeo";

export const metadata = PRIVATE_NOINDEX_METADATA;

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
    <main className="oft-public-surface relative min-h-screen overflow-hidden text-[#102015]">
      <PublicImageCollage
        images={[
          {
            src: "/backgrounds/delivery.png",
            alt: "Logistics and fulfilment partner",
            className: "right-[-140px] top-16 h-80 w-80 opacity-[0.34] md:h-[30rem] md:w-[30rem]",
          },
          {
            src: "/backgrounds/produce.png",
            alt: "Fresh produce supply",
            className: "left-[-150px] bottom-[-120px] h-80 w-80 opacity-[0.3] md:h-[28rem] md:w-[28rem]",
          },
        ]}
      />
      <div className="oft-public-topline absolute inset-x-0 top-0 h-2" />
      <div className="oft-orb-drift pointer-events-none absolute right-[-140px] top-20 h-[28rem] w-[28rem] rounded-full bg-[#1f7a3f]/14 blur-3xl" />
      <div className="oft-orb-drift-delay pointer-events-none absolute left-[-160px] bottom-[-180px] h-[30rem] w-[30rem] rounded-full bg-[#F2B84B]/30 blur-3xl" />

      <section className="relative mx-auto max-w-5xl px-6 py-8 lg:px-10">
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
