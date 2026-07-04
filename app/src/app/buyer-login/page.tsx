import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export default function BuyerLoginPage() {
  return (
    <main className="min-h-screen bg-[#F8F1E7] px-6 py-10 text-[#101712]">
      <section className="relative mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm">
        <div className="absolute inset-0 bg-[url('/brand/produce-pattern.svg')] bg-cover bg-center opacity-70" />
        <div className="absolute inset-0 bg-white/78" />

        <div className="relative w-full">
          <BrandMark />
          <p className="mt-8 text-sm font-black uppercase tracking-[0.24em] text-[#C95F3D]">
            Approved business buyers
          </p>
          <h1 className="mt-3 max-w-3xl text-5xl font-black tracking-tight">
            Recurring buyer accounts for serious food businesses.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#1E2420]/70">
            Approved buyer accounts are designed for restaurants, hotels, caterers,
            retailers and high-volume buyers who need receipts, order history,
            payment records, credit limits, outstanding balance tracking and repeat-order support.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              "Electronic receipts",
              "Order history",
              "Payment records",
              "Credit limit tracking",
              "Authorised buyer contacts",
              "Repeat order support",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#F8F1E7] p-4 text-sm font-black">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white"
            >
              Place WhatsApp request
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#101712]/10 bg-white px-5 py-3 text-sm font-black text-[#101712]"
            >
              Back home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
