import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const buyerTypes = [
  "Restaurants",
  "Hotels",
  "Caterers",
  "Food vendors",
  "Retailers",
  "Large households",
  "Buying groups",
  "Food processors",
];

const operatingSteps = [
  "Send your order request",
  "Admin confirms price and availability",
  "Payment or approved terms are confirmed",
  "OneFarmTech sources, checks, and coordinates delivery/pickup",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8f1e7] text-[#102015]">
      <SiteHeader />

      <main>
        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex rounded-full border border-[#102015]/10 bg-white px-4 py-2 text-sm font-bold text-[#3E7A4C]">
              WhatsApp-first food procurement
            </div>

            <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Farm-to-city buying, managed for serious food buyers.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#405348]">
              OneFarmTech helps kitchens, vendors, retailers, and buying groups
              request produce, confirm payments, join bulk buys, and coordinate
              pickup or delivery without managing farmers directly.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-[#102015] px-6 py-4 text-sm font-black text-white transition hover:bg-[#1f2a20]"
              >
                Open buyer portal
              </Link>

              <a
                href="https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20place%20a%20procurement%20order."
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#3E7A4C] px-6 py-4 text-sm font-black text-white transition hover:bg-[#2e613a]"
              >
                Start on WhatsApp
              </a>
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#405348]/70">
              Admin access is internal and not part of the public buyer journey.
            </p>
          </div>

          <div className="rounded-[2.5rem] bg-[#07120c] p-5 text-white shadow-2xl">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
              <BrandMark variant="light" />

              <div className="mt-8 rounded-3xl bg-[#f8f1e7] p-5 text-[#102015]">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#3E7A4C]">
                  Live order card
                </p>
                <h2 className="mt-3 text-2xl font-black">Weekend tomato supply</h2>
                <div className="mt-5 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#405348]">Buyer</span>
                    <strong>Mama T Foods</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#405348]">Status</span>
                    <strong>Approved for sourcing</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#405348]">Payment</span>
                    <strong>Deposit paid</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#405348]">Fulfilment</span>
                    <strong>Pickup Saturday</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-white/[0.08] p-5">
                  <p className="text-sm text-white/50">Group-buy reserved</p>
                  <p className="mt-2 text-3xl font-black text-[#9ee6ad]">72%</p>
                </div>
                <div className="rounded-3xl bg-white/[0.08] p-5">
                  <p className="text-sm text-white/50">WhatsApp updates</p>
                  <p className="mt-2 text-3xl font-black text-[#9ee6ad]">Manual</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 md:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Who it serves</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {buyerTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-[#f0eadf] px-4 py-2 text-sm font-bold text-[#405348]"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#102015] p-6 text-white shadow-sm">
            <h2 className="text-2xl font-black">How it works</h2>
            <div className="mt-5 grid gap-3">
              {operatingSteps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl bg-white/[0.06] p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9ee6ad] text-sm font-black text-[#102015]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-white/70">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
