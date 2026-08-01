import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicFooter from "@/components/PublicFooter";
import PublicImageCollage from "@/components/PublicImageCollage";
import PublicMobileMenu from "@/components/PublicMobileMenu";
import {buildWhatsAppLink} from "@/lib/whatsapp";
import {publicPageMetadata} from "@/lib/publicSeo";

export const metadata = publicPageMetadata("/impact");

const pillars = [
  {
    title: "A front door buyers already know how to use",
    body:
      "Most fresh-food buying in Nigeria still happens through phone calls, market visits and word of mouth. OneFarmTech meets buyers on WhatsApp instead of asking them to learn a new app — so ordering, confirming and tracking produce works for someone with a smartphone and a data bundle, not just someone comfortable with software.",
  },
  {
    title: "Demand that suppliers can plan around",
    body:
      "Group buying pools many small, unpredictable orders into one volume a supplier can commit to in advance. That turns scattered demand into a number a grower or aggregator can actually plan a harvest or delivery run against.",
  },
  {
    title: "One record from order to delivery",
    body:
      "Every order, payment, pickup and delivery is tracked in a single operational system instead of scattered across chats, notebooks and memory. That means a buyer's payment history, a supplier's fulfilment record, and a delivery's outcome are all things we can actually look up, not just recall.",
  },
  {
    title: "Growth we can account for",
    body:
      "We're early. Rather than publish projected or inflated numbers, we report what we can verify: confirmed orders, paid reservations, completed deliveries. As the platform grows, the reporting stays tied to real transactions.",
  },
];

const measurementRows = [
  ["Fulfilled order value", "What buyers actually paid for and received, not what was listed or promised."],
  ["Repeat buyer activity", "Whether a buyer who ordered once comes back — the clearest signal that the model works."],
  ["Supplier participation", "How many supply partners stay active across order cycles, not just the count who signed up once."],
  ["Delivery performance", "Whether orders arrive against pickup and delivery commitments, tracked per order, not by anecdote."],
];

export default function ImpactPage() {
  return (
    <main className="min-h-screen bg-[#fbfff8] text-[#101712]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_12%,rgba(31,122,63,0.14),transparent_32%),radial-gradient(circle_at_86%_18%,rgba(242,184,75,0.18),transparent_34%),linear-gradient(180deg,#fbfff8_0%,#f5faef_60%,#fbfff8_100%)]">
        <PublicImageCollage
          images={[
            {
              src: "/backgrounds/buyers.png",
              alt: "",
              className: "left-[-190px] top-[-40px] h-72 w-72 opacity-[0.22] md:h-[26rem] md:w-[26rem]",
            },
            {
              src: "/backgrounds/produce.png",
              alt: "",
              className: "right-[-190px] bottom-[-60px] hidden h-72 w-72 opacity-[0.24] md:block md:h-[27rem] md:w-[27rem]",
            },
          ]}
        />
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#1f7a3f] via-[#F2B84B] to-[#1f7a3f]" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="Go to OneFarmTech homepage">
              <BrandMark />
            </Link>
            <nav className="hidden items-center gap-3 md:flex">
              <Link href="/faq" className="rounded-full px-4 py-3 text-sm font-black text-[#101712] hover:bg-white">
                FAQ
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-[#101712]/10 bg-white px-5 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-[#f3f8ef]"
              >
                Partner with us
              </Link>
              <a
                href={buildWhatsAppLink(encodeURIComponent("Hello OneFarmTech, I want to place a fresh food order."))}
                className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
              >
                Order on WhatsApp
              </a>
            </nav>
            <PublicMobileMenu />
          </header>

          <section className="max-w-4xl py-14 md:py-20">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#1f7a3f]">
              Our impact
            </p>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Fixing the coordination gap in fresh food supply.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#405348]">
              Fresh food in Nigeria doesn't move because supply is scarce — it moves
              badly because buyers, suppliers and delivery are coordinated through
              scattered phone calls and memory instead of a shared record. OneFarmTech
              exists to close that gap.
            </p>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#587063]">
              This page is written for NGOs, development finance institutions and
              impact partners evaluating whether OneFarmTech's model is worth
              supporting — as much as it is for the buyers and suppliers who use it.
            </p>
          </section>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-[#102015]/10 bg-white p-7 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9b2f12]">
              The problem
            </p>
            <h2 className="mt-3 text-2xl font-black">
              Informal coordination doesn't scale.
            </h2>
            <p className="mt-4 leading-7 text-[#405348]">
              A restaurant calling three different suppliers to see who has tomatoes
              today. A grower with no reliable way to know how much a city actually
              wants next week. A delivery that "should have arrived" with no record
              of when it actually did. None of this is a supply problem — Nigeria
              produces enough fresh food. It's a coordination problem, and it costs
              buyers money, suppliers certainty, and everyone time.
            </p>
          </article>

          <article className="rounded-[2rem] border border-[#102015]/10 bg-white p-7 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
              Our approach
            </p>
            <h2 className="mt-3 text-2xl font-black">
              One workflow, from order to delivery.
            </h2>
            <p className="mt-4 leading-7 text-[#405348]">
              OneFarmTech runs ordering over WhatsApp — the channel buyers already
              use — and connects it to a single operational system for payments,
              group buying, fulfilment and delivery. The result is a fresh-food
              supply chain that behaves like it's being run by a company, not
              improvised by a chat thread.
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-[2rem] border border-[#102015]/10 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-black leading-snug">{pillar.title}</h2>
              <p className="mt-3 leading-7 text-[#405348]">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f3f8ef] py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
              About us
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Built around how buyers actually order.
            </h2>
            <p className="mt-5 leading-8 text-[#405348]">
              OneFarmTech started from a simple observation: households, food
              vendors, restaurants and offices across Nigeria were already ordering
              fresh produce over WhatsApp — informally, inconsistently, one message
              at a time — because that's the tool they trust and already know. Rather
              than compete with that habit, we built the operational layer underneath
              it: structured ordering, payment confirmation, group buying and
              delivery tracking, all reachable from the same chat a buyer would have
              sent anyway.
            </p>
            <p className="mt-4 leading-8 text-[#405348]">
              We're a small operating team based in Abuja, working directly with
              buyers and supply partners rather than building for a market we assume
              exists. What's on this site reflects what we run today, not a pitch
              deck version of where we hope to be.
            </p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
              Our vision
            </p>
            <h2 className="mt-3 text-3xl font-black">
              A fresh food supply chain that keeps a record of itself.
            </h2>
            <p className="mt-5 leading-8 text-[#405348]">
              We want a future where a food vendor in Jos can commit to a
              supplier three weeks out because demand is visible, not guessed at
              — where a household ordering weekly groceries has the same
              payment and delivery certainty as a corporate account — and where
              "did this order arrive, and who paid what" is a question with a
              recorded answer, not a phone call away.
            </p>
            <p className="mt-4 leading-8 text-[#405348]">
              Getting there means growing carefully: proving the model on real
              orders and real routes before scaling it, and staying accountable to
              the buyers and suppliers who depend on it working every week, not
              just when it's convenient.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="rounded-[2rem] bg-[#102015] p-8 text-white md:p-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F2B84B]">
            How we measure impact
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black">
            Figures we can trace back to a real order.
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-white/70">
            We track what matters to buyers and suppliers directly, and only report
            what we can verify against actual transactions — not projections.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {measurementRows.map(([label, body]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-black text-[#F2B84B]">{label}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <div className="rounded-[2rem] border border-[#1f7a3f]/15 bg-white p-8 shadow-sm md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-black md:text-3xl">
                Working on food security, SME finance or market access?
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-[#405348]">
                If you're an NGO, development finance institution or impact partner
                exploring how structured demand data or buyer/supplier coordination
                fits your programme, we'd like to talk.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f] md:justify-self-end"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
