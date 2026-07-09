import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

export default function PrivacyPage() {
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
          <h1 className="mt-3 text-3xl font-black md:text-4xl">Privacy policy</h1>

          <div className="mt-6 grid gap-5 text-[0.92rem] leading-7 text-[#405348]">
            <section>
              <h2 className="font-black text-[#102015]">Information we collect</h2>
              <p className="mt-2">We collect information needed to process produce orders, buyer accounts, supplier relationships, payments, delivery support and customer communication. This may include names, phone numbers, email addresses, company details, delivery information, order history, payment references and support messages.</p>
            </section>

            <section>
              <h2 className="font-black text-[#102015]">How we use information</h2>
              <p className="mt-2">We use information to operate the service, confirm orders, support payments, issue receipts, coordinate delivery, respond to support requests, manage buyer and partner records, improve reliability and maintain operational evidence.</p>
            </section>

            <section>
              <h2 className="font-black text-[#102015]">WhatsApp, email and service messages</h2>
              <p className="mt-2">OneFarmTech may use WhatsApp, email, phone calls or platform messages to communicate about orders, payments, receipts, delivery updates, support issues and account activity.</p>
            </section>

            <section>
              <h2 className="font-black text-[#102015]">Sharing and service providers</h2>
              <p className="mt-2">We do not sell personal data. We may share limited information with service providers such as payment processors, delivery partners, hosting providers, communication tools and operational support tools where needed to provide the service.</p>
            </section>

            <section>
              <h2 className="font-black text-[#102015]">Retention and correction</h2>
              <p className="mt-2">We retain records where needed for operations, payment evidence, customer support, accounting, dispute handling and compliance. Users may contact us to request correction of inaccurate information.</p>
            </section>
          </div>
        </article>
      </section>

      <PublicFooter />
    </main>
  );
}
