import Link from "next/link";
import {BrandMark} from "@/components/BrandMark";

const requestSteps = [
  {
    title: "Send your request",
    description:
      "Share your produce list, quantities, location, buyer type and preferred pickup or delivery option.",
  },
  {
    title: "Confirm terms",
    description:
      "OneFarmTech confirms availability, fulfilment route, payment terms and timing through WhatsApp.",
  },
  {
    title: "Receive updates and records",
    description:
      "Get payment instructions, order updates, receipt records and repeat-order support.",
  },
];

const portalCards = [
  {
    title: "Individual or household request",
    description: "For homes and high-volume household buying.",
  },
  {
    title: "Business buyer request",
    description: "For restaurants, hotels, caterers, food vendors and retailers.",
  },
  {
    title: "Group-buy request",
    description: "For city routes, pickup areas, friends, families, offices and communities.",
  },
  {
    title: "Approved buyer login",
    description: "For recurring business buyers with receipts, credit records and order history.",
  },
];

export default function BuyerRequestPage() {
  const whatsappText = encodeURIComponent(
    "Hello OneFarmTech, I want to place a produce request. Buyer type: ___ Location: ___ Items/quantities: ___ Preferred pickup/delivery: ___",
  );

  return (
    <main className="min-h-screen bg-[#F8F1E7] text-[#101712]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/brand/portal-pattern.svg')] bg-cover bg-center opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8F1E7]/96 via-[#F8F1E7]/90 to-[#F2B84B]/20" />

        <div className="relative mx-auto max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
          <div className="mb-10 flex items-center justify-between">
            <BrandMark />
            <Link
              href="/"
              className="rounded-full border border-[#101712]/10 bg-white/70 px-4 py-2 text-sm font-bold text-[#101712] shadow-sm hover:bg-white"
            >
              Back home
            </Link>
          </div>

          <p className="inline-flex rounded-full bg-white/75 px-4 py-2 text-sm font-black text-[#C95F3D] shadow-sm">
            Buyer portal
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
            Request produce, join group buys, or manage recurring buyer access.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#1E2420]/75">
            Restaurants, caterers, hotels, food vendors, retailers, large households,
            families, friends and community buying groups can use OneFarmTech for
            coordinated farm-to-city procurement.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/?text=${whatsappText}`}
              className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm"
            >
              Start WhatsApp request
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                "Hello OneFarmTech, I want to request a city or private group buy. Location: ___ Items: ___ Estimated buyers/quantity: ___",
              )}`}
              className="rounded-full border border-[#101712]/10 bg-white/70 px-6 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-white"
            >
              Request group buy
            </a>
            <Link
              href="/buyer-login"
              className="rounded-full border border-[#101712]/10 bg-white/70 px-6 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-white"
            >
              Approved buyer login
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-12 md:grid-cols-2 lg:px-10">
        {portalCards.map((card) => (
          <div key={card.title} className="rounded-[1.5rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#1E2420]/70">{card.description}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-14 lg:grid-cols-3 lg:px-10">
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
    </main>
  );
}
