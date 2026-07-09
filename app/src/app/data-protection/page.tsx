import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";

export default function DataProtectionPage() {
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
          <h1 className="mt-3 text-3xl font-black md:text-4xl">Data protection</h1>

          <div className="mt-6 grid gap-5 text-[0.92rem] leading-7 text-[#405348]">
            <section>
              <h2 className="font-black text-[#102015]">Operational records</h2>
              <p className="mt-2">OneFarmTech keeps operational records for orders, payments, receipts, buyer support, supplier coordination, delivery evidence, complaints and account activity.</p>
            </section>

            <section>
              <h2 className="font-black text-[#102015]">Access control</h2>
              <p className="mt-2">Access to internal records should be limited to authorised team members who need the information to serve buyers, suppliers, delivery partners and support workflows.</p>
            </section>

            <section>
              <h2 className="font-black text-[#102015]">Access codes and account data</h2>
              <p className="mt-2">Buyer access codes, partner access codes, payment references and account information should not be shared publicly or stored in unsecured channels. Codes should be reset or revoked where compromise is suspected.</p>
            </section>

            <section>
              <h2 className="font-black text-[#102015]">Third-party tools</h2>
              <p className="mt-2">Where third-party tools are used for payments, communication, hosting, analytics or operations, they should be reviewed for security, privacy, reliability and operational fit.</p>
            </section>

            <section>
              <h2 className="font-black text-[#102015]">Incident handling</h2>
              <p className="mt-2">Suspected data incidents should be reviewed promptly, access should be restricted where necessary, and affected records or users should be handled according to the seriousness of the issue.</p>
            </section>
          </div>
        </article>
      </section>

      <PublicFooter />
    </main>
  );
}
