import Link from "next/link";
import {BrandMark} from "@/components/BrandMark";

const requestSteps = [
  {
    title: "Tell us what you need",
    description:
      "Share produce, quantity, city or delivery area, buyer type, and preferred timing.",
  },
  {
    title: "We confirm allocation and terms",
    description:
      "Our team reviews the request, confirms availability, payment terms, pickup or delivery route, and next steps.",
  },
  {
    title: "Pay, collect, receive, or reorder",
    description:
      "Receive payment instructions, fulfilment updates, receipts, and support through WhatsApp while buyer accounts are being prepared.",
  },
];

const accountFeatures = [
  "Electronic receipts and order records",
  "Payment history and outstanding balances",
  "Approved credit limit tracking",
  "Repeat order shortcuts",
  "Business profile and authorised contacts",
  "Pickup and delivery history",
];

export default function BuyerRequestPage() {
  const whatsappText = encodeURIComponent(
    "Hello OneFarmTech, I want to place a produce request. Buyer type: ___ Location: ___ Items/quantities: ___ Preferred pickup/delivery: ___",
  );

  return (
    <main className="min-h-screen bg-[#F8F1E7] text-[#101712]">
      <section className="relative overflow-hidden bg-[#101712] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,184,75,0.20),transparent_32%),radial-gradient(circle_at_15%_20%,rgba(62,122,76,0.30),transparent_34%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
          <div className="mb-10 flex items-center justify-between">
            <BrandMark />
            <Link
              href="/"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Back home
            </Link>
          </div>

          <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-[#F2B84B]">
            Buyer request portal
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-5xl">
            Place produce requests by WhatsApp while we prepare approved business accounts.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">
            OneFarmTech is currently WhatsApp-first. Restaurants, caterers,
            hotels, food vendors, retailers, large households, and buying
            groups can submit requests for coordinated fulfilment, pickup,
            delivery, receipts, and repeat-order support.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/?text=${whatsappText}`}
              className="rounded-full bg-[#F2B84B] px-6 py-3 text-sm font-black text-[#101712] shadow-lg"
            >
              Start WhatsApp request
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                "Hello OneFarmTech, I want to request a city or private group buy. Location: ___ Items: ___ Estimated buyers/quantity: ___",
              )}`}
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Request group buy
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 lg:grid-cols-3 lg:px-10">
        {requestSteps.map((step, index) => (
          <div key={step.title} className="rounded-[1.5rem] bg-white p-6 shadow-sm">
            <p className="text-sm font-black text-[#C95F3D]">Step {index + 1}</p>
            <h2 className="mt-2 text-xl font-black">{step.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#1E2420]/70">
              {step.description}
            </p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-14 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div className="rounded-[1.5rem] bg-[#101712] p-7 text-white">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#F2B84B]">
            Approved recurring buyers
          </p>
          <h2 className="mt-4 text-3xl font-black">
            Business buyer login is part of the pre-live build.
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/70">
            We are not showing fake account access. Approved recurring buyers
            will need proper login before serious team or buyer testing,
            especially for receipts, credit limits, payments, and repeat orders.
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-black">Business account features planned</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {accountFeatures.map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-[#101712]/10 bg-[#F8F1E7] p-4 text-sm font-bold"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
