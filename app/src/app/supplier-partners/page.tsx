import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";
import TurnstileWidget from "@/components/TurnstileWidget";
import {createSupplierEnquiryAction} from "@/actions/publicApplications";
import {publicIntakeErrorMessage} from "@/lib/publicIntakeProtection";

const partnerTypes = [
  "Farms",
  "Aggregators",
  "Cooperatives",
  "Market suppliers",
  "Processors",
  "Cold-chain partners",
  "Logistics partners",
  "Packaging partners",
];

export default async function SupplierPartnersPage({searchParams}: {searchParams?: Promise<{submitted?: string; error?: string}>}) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-[#fbfff8] text-[#102015]">
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Go to OneFarmTech homepage"><BrandMark /></Link>
          <Link href="/contact" className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white">
            Contact
          </Link>
        </header>

        <div className="grid gap-8 py-14 lg:grid-cols-[1fr_0.75fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-[#1f7a3f]/15 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
              Supplier partners
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
              Supply quality produce to serious buyers.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#405348]">
              OneFarmTech works with growers, aggregators and logistics partners who can support reliable fresh food supply.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#102015]/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">Partner types</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {partnerTypes.map((item) => (
                <span key={item} className="rounded-2xl bg-[#f3f8ef] px-4 py-3 text-sm font-black">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">What we look for</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              "Consistent supply or clear seasonal availability",
              "Fair pricing and transparent grading",
              "Reliable communication",
              "Quality control and issue resolution",
              "Ability to fulfil confirmed buyer demand",
              "Clear pickup, delivery or aggregation arrangements",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#f3f8ef] p-4 text-sm font-semibold text-[#405348]">
                {item}
              </div>
            ))}
          </div>
        </section>
        <section className="mt-8 rounded-[2rem] border border-[#102015]/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">Become a supplier or partner</h2>
          {params?.submitted === "1" ? <div role="status" className="mt-4 rounded-xl bg-[#eef8ef] p-4 font-bold text-[#155c2f]">Your supplier enquiry has been received.</div> : null}
          {params?.error ? <div role="alert" className="mt-4 rounded-xl bg-red-50 p-4 font-bold text-red-700">{params.error === "validation" ? "Complete the required supplier details." : publicIntakeErrorMessage(params.error)}</div> : null}
          <form action={createSupplierEnquiryAction} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">Business / farm name<input name="businessName" required className="rounded-xl border px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Contact person<input name="contactName" required className="rounded-xl border px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Phone<input name="phone" required className="rounded-xl border px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Email<input name="email" type="email" className="rounded-xl border px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Location<input name="location" required className="rounded-xl border px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold">Relationship type<select name="relationshipType" required className="rounded-xl border px-4 py-3 font-normal">{partnerTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Products supplied<textarea name="products" required rows={3} className="rounded-xl border px-4 py-3 font-normal" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Supply capacity or brief note<textarea name="capacity" rows={3} className="rounded-xl border px-4 py-3 font-normal" /></label>
            <div className="hidden" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
            <div className="sm:col-span-2"><TurnstileWidget action="supplier_enquiry" idleLabel="Send supplier enquiry" pendingLabel="Submitting…" /></div>
          </form>
        </section>
      </section>

      <PublicFooter />
    </main>
  );
}
