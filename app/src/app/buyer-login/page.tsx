import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export default function BuyerLoginPage() {
  return (
    <main className="min-h-screen bg-[#F8F1E7] px-6 py-10 text-[#101712]">
      <section className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center">
        <div className="w-full rounded-[2rem] bg-white p-8 shadow-sm">
          <BrandMark />
          <p className="mt-8 text-sm font-black uppercase tracking-[0.24em] text-[#C95F3D]">
            Approved business buyers
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight">
            Buyer login is being prepared for recurring business accounts.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#1E2420]/70">
            OneFarmTech buyer accounts will support electronic receipts, order
            history, payment records, credit limits, outstanding balances, repeat
            orders, authorised contacts, and business profiles. We are not opening
            fake login access before proper authentication is connected.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white"
            >
              Place WhatsApp request
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#101712]/10 px-5 py-3 text-sm font-bold text-[#101712]"
            >
              Back home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
