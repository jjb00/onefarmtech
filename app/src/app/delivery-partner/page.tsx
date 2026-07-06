import Link from "next/link";
import DeliveryPartnerMobileMenu from "@/components/DeliveryPartnerMobileMenu";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function DeliveryPartnerLandingPage() {
  return (
    <main className="min-h-screen bg-[#f7f5ec] px-4 py-10 text-[#102015] sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-5xl gap-6 rounded-[2rem] bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex items-start justify-between gap-4 lg:col-span-2">
          <Link href="/" className="text-sm font-black text-[#1f7a3f] hover:underline">
            OneFarmTech
          </Link>
          <DeliveryPartnerMobileMenu />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            OneFarmTech logistics
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Delivery partner portal
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#405348]">
            View assigned deliveries, update fulfilment status and record proof-of-delivery notes.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/delivery-partner/login"
              className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
            >
              Partner login
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#102015]/15 bg-white px-6 py-3 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
            >
              Back to OneFarmTech
            </Link>
          </div>
        </div>

        <aside className="rounded-[2rem] bg-[#f3f8ef] p-6">
          <h2 className="text-xl font-black">Portal v1</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-7 text-[#405348]">
            <li>• Accept assigned jobs</li>
            <li>• Mark pickup and transit status</li>
            <li>• Confirm delivery</li>
            <li>• Add delivery issue notes</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
