import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

export default function TermsPage() {
  return (
    <main className="oft-product-shell min-h-screen bg-[#fbfff8] text-[#102015]">
      <section className="mx-auto max-w-3xl px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Go to OneFarmTech homepage">
            <BrandMark />
          </Link>
          <Link href="/" className="rounded-full border border-[#102015]/10 bg-white px-4 py-2 text-sm font-black text-[#102015] shadow-sm hover:bg-[#f3f8ef]">
            Home
          </Link>
        </header>

        <article className="mt-10 rounded-[1.5rem] border border-[#102015]/10 bg-white p-5 shadow-sm md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">Legal</p>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">Terms of use</h1>

          <div className="mt-6 grid gap-5 text-[0.92rem] leading-7 text-[#405348]">
            <section>
              <h2 className="font-black text-[#102015]">Service use</h2>
              <p className="mt-2">OneFarmTech helps buyers request and manage fresh produce orders, payments, receipts, group-buy interest and delivery support. Users should provide accurate contact, delivery and payment information.</p>
            </section>

            <section>
              <h2 className="font-black text-[#102015]">Prices and availability</h2>
              <p className="mt-2">Prices, availability, grades, delivery windows and group-buy openings may change based on supply, quality, logistics, market conditions and supplier confirmation.</p>
            </section>

            <section>
              <h2 className="font-black text-[#102015]">Orders and fulfilment</h2>
              <p className="mt-2">Orders may require confirmation, payment, allocation and fulfilment checks before delivery or pickup is completed. OneFarmTech may contact buyers to clarify order details, substitutions, timing or payment status.</p>
            </section>

            <section>
              <h2 className="font-black text-[#102015]">Payments and receipts</h2>
              <p className="mt-2">Payment requests, receipts and payment references are used as operational evidence. Buyers should only use payment instructions provided through official OneFarmTech channels.</p>
            </section>

            <section>
              <h2 className="font-black text-[#102015]">Misuse</h2>
              <p className="mt-2">Misuse of the service, false information, abuse of staff or partners, fraudulent payment evidence, or unauthorised access attempts may result in order cancellation, account restriction or further action.</p>
            </section>
          </div>
        </article>
      </section>

      <PublicFooter />
    </main>
  );
}
