import Link from "next/link";
import BrandMark from "@/components/BrandMark";

const buyerActions = [
  {
    title: "Place an order",
    description: "Send a WhatsApp-style request for produce, bulk buying, or recurring supply.",
    href: "https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20place%20an%20order.",
  },
  {
    title: "Join a group buy",
    description: "Ask what bulk buying opportunities are currently open.",
    href: "https://wa.me/?text=Hello%20OneFarmTech%2C%20what%20group%20buys%20are%20open%20this%20week%3F",
  },
  {
    title: "Request business supply",
    description: "For restaurants, caterers, hotels, vendors, and retailers.",
    href: "https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20need%20business%20food%20procurement%20support.",
  },
];

export default function BuyerDashboardPage() {
  return (
    <main className="min-h-screen bg-[#f8f1e7] px-6 py-8 text-[#102015]">
      <section className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/">
            <BrandMark />
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[#102015]/10 px-5 py-3 text-sm font-bold text-[#405348]"
          >
            Back home
          </Link>
        </div>

        <div className="mt-10 rounded-[2.5rem] bg-[#07120c] p-8 text-white">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#9ee6ad]">
            Buyer portal
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-tight">
            Request supply through OneFarmTech.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/65">
            This is the buyer-facing entry point for now. Full self-serve buyer
            accounts will come later; the MVP keeps ordering WhatsApp-first and
            admin-managed.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {buyerActions.map((action) => (
            <a
              key={action.title}
              href={action.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-[2rem] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-2xl font-black">{action.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#405348]">
                {action.description}
              </p>
              <span className="mt-6 inline-flex rounded-full bg-[#3E7A4C] px-5 py-3 text-sm font-black text-white">
                Open WhatsApp
              </span>
            </a>
          ))}
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#102015]/10 bg-white p-6">
          <h2 className="text-2xl font-black">Payment logic</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#405348]">
            New individual buyers usually pay before sourcing. New business buyers
            may pay in full or deposit before sourcing. Verified business buyers may
            later receive approved credit terms. Group-buy slots are reserved after
            upfront payment or admin approval.
          </p>
        </div>
      </section>
    </main>
  );
}
