import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";
import PublicMobileMenu from "@/components/PublicMobileMenu";

export const metadata = {
  title: "Impact | OneFarmTech",
  description:
    "How OneFarmTech improves produce access, market coordination and responsible food supply.",
};

export default function ImpactPage() {
  return (
    <main className="min-h-screen bg-[#fbfff8] text-[#102015]">
      <header className="border-b bg-white px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" aria-label="OneFarmTech home">
            <BrandMark />
          </Link>
          <PublicMobileMenu />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-16 md:py-24">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#1f7a3f]">
          Our impact
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
          Better coordination for fresh food supply.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#405348]">
          OneFarmTech gives buyers a straightforward way to request produce,
          confirm payments and coordinate fulfilment — with clearer records
          and fewer avoidable delays.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            [
              "Reliable sourcing",
              "Helping buyers communicate demand clearly and receive structured order updates.",
            ],
            [
              "Market access",
              "Creating clearer demand signals and commercial opportunities for responsible supply partners.",
            ],
            [
              "Transparent fulfilment",
              "Connecting order, payment, pickup and delivery records in one operational workflow.",
            ],
            [
              "Responsible growth",
              "Growing carefully, with real numbers we can stand behind rather than inflated claims.",
            ],
          ].map(([title, body]) => (
            <article key={title} className="rounded-[2rem] border bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-[#405348]">{body}</p>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-[2rem] bg-[#102015] p-8 text-white">
          <h2 className="text-3xl font-black">How we measure impact</h2>
          <p className="mt-4 max-w-3xl leading-8 text-white/75">
            We track what matters to buyers and suppliers directly: fulfilled
            order value, repeat buyer activity, supplier participation and
            delivery performance. As that track record builds, we report it
            honestly — real figures from real orders, not projections.
          </p>
        </section>
      </section>

      <PublicFooter />
    </main>
  );
}
