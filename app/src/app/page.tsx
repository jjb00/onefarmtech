import Link from "next/link";
import {getDailyActivitySnapshot} from "@/lib/dailyActivity";
import {BrandMark} from "@/components/BrandMark";

const buyerTypes = [
  "Restaurants",
  "Hotels",
  "Caterers",
  "Food vendors",
  "Retailers / mini-marts",
  "Large households",
  "Buying groups",
];

const groupBuyRoutes = [
  {
    title: "Join a city group buy",
    description:
      "Join active produce allocations around your city, area, or pickup location.",
  },
  {
    title: "Request a group buy",
    description:
      "Tell us what your area needs and our team can review, price, and activate it.",
  },
  {
    title: "Create a private group",
    description:
      "Set up a private buying group for friends, neighbours, offices, churches, restaurants, or retail clusters.",
  },
];

export default function HomePage() {
  const activity = getDailyActivitySnapshot();

  return (
    <main className="min-h-screen bg-[#101712] text-[#F8F1E7]">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,184,75,0.20),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(201,95,61,0.18),transparent_28%),linear-gradient(135deg,rgba(62,122,76,0.18),transparent_42%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-16">
          <div>
            <div className="mb-10 flex items-center justify-between">
              <BrandMark />
              <Link
                href="/dashboard"
                className="rounded-full border border-[#F2B84B]/50 px-4 py-2 text-sm font-semibold text-[#F2B84B] transition hover:bg-[#F2B84B] hover:text-[#101712]"
              >
                Start WhatsApp request
              </Link>
            </div>

            <p className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#F2B84B]">
              WhatsApp-first farm-to-city procurement
            </p>

            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Managed food procurement for serious Nigerian buyers.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#F8F1E7]/80">
              OneFarmTech coordinates fresh produce requests, group buys,
              payments, pickup, delivery, complaints, and buyer communication
              through a managed operations centre — starting with WhatsApp.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-[#F2B84B] px-6 py-3 text-sm font-bold text-[#101712] shadow-lg transition hover:scale-[1.02]"
              >
                Request produce
              </Link>
              <Link
                href="/faq"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                How it works
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {buyerTypes.map((type) => (
                <div
                  key={type}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-[#F8F1E7]/90"
                >
                  {type}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#F8F1E7] p-5 text-[#101712] shadow-2xl">
            <div className="rounded-[1.5rem] bg-[#101712] p-5 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#F2B84B]">
                Today&apos;s procurement snapshot
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="buyer requests coordinated" value={activity.buyerRequests} />
                <Metric label="active city group buys" value={activity.activeGroupBuys} />
                <Metric label="pickup / delivery windows" value={activity.pickupWindows} />
                <Metric label="private group requests" value={activity.privateGroupRequests} />
              </div>
              <p className="mt-5 text-xs leading-5 text-white/60">
                Snapshot updates daily during MVP. Later this will connect to
                live database activity.
              </p>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-[#101712]/10 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#C95F3D]">
                    Group buys
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    City and private buying groups
                  </h2>
                </div>
                <span className="rounded-full bg-[#3E7A4C]/10 px-3 py-1 text-xs font-bold text-[#3E7A4C]">
                  Admin-reviewed
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {groupBuyRoutes.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#101712]/10 bg-[#F8F1E7] p-4"
                  >
                    <h3 className="font-black">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#1E2420]/70">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard?flow=group-buy"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#3E7A4C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2f613c]"
              >
                Start group-buy request
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F8F1E7] px-6 py-14 text-[#101712] lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          <InfoCard
            title="Managed procurement, not an open marketplace"
            description="Buyers submit requests. OneFarmTech coordinates supply allocation, quality expectations, payments, pickup, delivery, and issue handling."
          />
          <InfoCard
            title="Built around WhatsApp first"
            description="The MVP keeps ordering familiar: WhatsApp requests, admin confirmation, payment instructions, fulfilment updates, and receipts."
          />
          <InfoCard
            title="Business buyer accounts"
            description="Approved recurring buyers will have accounts for receipts, payment history, order records, credit limits, and business profile management."
          />
        </div>
      </section>
    </main>
  );
}

function Metric({label, value}: {label: string; value: number}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-3xl font-black text-[#F2B84B]">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-white/70">{label}</p>
    </div>
  );
}

function InfoCard({title, description}: {title: string; description: string}) {
  return (
    <div className="rounded-[1.5rem] border border-[#101712]/10 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#1E2420]/70">{description}</p>
    </div>
  );
}
