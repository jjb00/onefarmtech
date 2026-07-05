import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicImageCollage from "@/components/PublicImageCollage";

export default function BuyerLoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fbfff8] px-6 py-10 text-[#101712]">
      <PublicImageCollage
        images={[
          {
            src: "/backgrounds/buyers.png",
            alt: "Nigerian recurring fresh food buyers",
            className: "right-[-180px] top-20 h-80 w-80 opacity-[0.38] md:h-[32rem] md:w-[32rem]",
          },
          {
            src: "/backgrounds/banking.png",
            alt: "Buyer account payment and credit support",
            className: "left-[-170px] bottom-[-120px] h-80 w-80 opacity-[0.34] md:h-[30rem] md:w-[30rem]",
          },
          {
            src: "/backgrounds/produce.png",
            alt: "Fresh produce baskets",
            className: "bottom-[-150px] right-[28%] hidden h-[24rem] w-[24rem] opacity-[0.36] lg:block",
          },
        ]}
      />
      <div className="pointer-events-none absolute right-[-140px] top-20 h-[28rem] w-[28rem] rounded-full bg-[#1f7a3f]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-[-160px] bottom-[-180px] h-[30rem] w-[30rem] rounded-full bg-[#F2B84B]/25 blur-3xl" />

      <section className="relative mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="oft-fade-up w-full rounded-[2rem] border border-[#101712]/10 bg-white/95 p-8 shadow-sm backdrop-blur">
          <Link href="/" aria-label="Go to OneFarmTech homepage" className="inline-flex">
            <BrandMark />
          </Link>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.24em] text-[#C95F3D]">
            Recurring buyers
          </p>
          <h1 className="mt-3 max-w-3xl text-5xl font-black tracking-tight">
            Create your OneFarmTech buyer account.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#1E2420]/70">
            Buyer accounts are for regular restaurants, hotels, caterers, retailers,
            offices, food vendors and other repeat customers who want order history,
            receipts, payment records, authorised contacts and repeat-order support.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              "Order history",
              "Electronic receipts",
              "Payment records",
              "Authorised contacts",
              "Credit and balance tracking",
              "Repeat-order support",
            ].map((item) => (
              <div
                key={item}
                className="oft-card-lift rounded-2xl bg-[#f3f8ef] p-4 text-sm font-black"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/buyer-account-request"
              className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
            >
              Request account setup
            </Link>
            <Link
              href="/order-request"
              className="rounded-full border border-[#101712]/10 bg-white px-5 py-3 text-sm font-black text-[#101712]"
            >
              Order
            </Link>
            <Link
              href="/faq"
              className="rounded-full border border-[#101712]/10 bg-white px-5 py-3 text-sm font-black text-[#101712]"
            >
              Read FAQ
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-[#101712]/10 bg-white px-5 py-3 text-sm font-black text-[#101712]"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
