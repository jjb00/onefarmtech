import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fbfff8] text-[#102015]">
      <section className="mx-auto max-w-4xl px-6 py-10 lg:px-10">
        <Link href="/" aria-label="Go to OneFarmTech homepage"><BrandMark /></Link>
        <h1 className="mt-10 text-4xl font-black">Terms of use</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-[#405348]">
          <p>OneFarmTech helps buyers request and manage fresh produce orders, payments, receipts, group-buy interest and delivery support.</p>
          <p>Prices, availability, delivery windows and group-buy openings may change based on supply, quality, logistics and market conditions.</p>
          <p>Orders may require confirmation, payment, allocation and fulfilment checks before delivery or pickup is completed.</p>
          <p>Users should provide accurate contact, delivery and payment information. Misuse of the service may result in account restriction.</p>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
