import Link from "next/link";
import {getDailyActivitySnapshot} from "@/lib/dailyActivity";
import {BrandMark} from "@/components/BrandMark";

const buyerTypes = [
  "Restaurants",
  "Hotels",
  "Caterers",
  "Food vendors",
  "Retailers",
  "Large households",
  "Buying groups",
];

const homepageCards = [
  {
    title: "Request produce",
    description: "Send your items, quantities, location and preferred fulfilment option.",
    href: "/dashboard",
  },
  {
    title: "Join city group buys",
    description: "Participate in area-based group buys around pickup points and delivery routes.",
    href: "/dashboard?flow=group-buy",
  },
  {
    title: "Create a private group",
    description: "Set up a buying group for family, friends, neighbours, offices, churches or food businesses.",
    href: "/dashboard?flow=private-group",
  },
  {
    title: "Recurring buyer login",
    description: "For approved restaurants, hotels, caterers, retailers and high-volume buyers.",
    href: "/buyer-login",
  },
];

export default function HomePage() {
  const activity = getDailyActivitySnapshot();

  return (
    <main className="min-h-screen bg-[#F8F1E7] text-[#101712]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/brand/market-pattern.svg')] bg-cover bg-center opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8F1E7]/95 via-[#F8F1E7]/88 to-[#F2B84B]/25" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
          <header className="flex items-center justify-between gap-6">
            <BrandMark />
            <div className="flex items-center gap-3">
              <Link
                href="/buyer-login"
                className="hidden rounded-full border border-[#101712]/10 bg-white/70 px-5 py-3 text-sm font-black text-[#101712] shadow-sm transition hover:bg-white md:inline-flex"
              >
                Buyer login
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#155c2f]"
              >
                Buyer portal
              </Link>
            </div>
          </header>

          <div className="grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
            <div>
              <p className="inline-flex rounded-full bg-white/75 px-4 py-2 text-sm font-black text-[#C95F3D] shadow-sm">
                WhatsApp-first farm-to-city procurement
              </p>

              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-[#101712] md:text-7xl">
                Fresh food procurement for Nigerian buyers who need reliability.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#1E2420]/75">
                OneFarmTech coordinates produce requests, group buys, payment records,
                pickup, delivery, receipts and buyer communication through a managed
                operations desk built around WhatsApp.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#155c2f]"
                >
                  Start a request
                </Link>
                <Link
                  href="/dashboard?flow=group-buy"
                  className="rounded-full border border-[#101712]/10 bg-white/70 px-6 py-3 text-sm font-black text-[#101712] shadow-sm transition hover:bg-white"
                >
                  Join a group buy
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                {buyerTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-[#101712]/10 bg-white/70 px-4 py-2 text-sm font-bold text-[#1E2420]/75 shadow-sm"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#101712]/10 bg-white/88 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-[1.5rem] bg-[#101712] p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-[#F2B84B]">
                      Active group-buy activity
                    </p>
                    <h2 className="mt-2 text-3xl font-black">Live buying routes</h2>
                  </div>
                  <span className="rounded-full bg-[#3E7A4C] px-3 py-1 text-xs font-black text-white">
                    Open
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Metric label="city group buys" value={activity.activeGroupBuys} />
                  <Metric label="buyer requests today" value={activity.buyerRequests} />
                  <Metric label="pickup / delivery windows" value={activity.pickupWindows} />
                  <Metric label="private group requests" value={activity.privateGroupRequests} />
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <GroupBuyRow
                  title="City group buy"
                  detail="Join buyers around your city, area, pickup point or delivery route."
                />
                <GroupBuyRow
                  title="Private family & friends group"
                  detail="Create a private buying group for family, friends, neighbours or communities."
                />
                <GroupBuyRow
                  title="Business buying group"
                  detail="Useful for restaurants, offices, caterers, retailers and food vendors buying together."
                />
              </div>

              <Link
                href="/dashboard?flow=group-buy"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#F2B84B] px-5 py-3 text-sm font-black text-[#101712] transition hover:brightness-95"
              >
                Start group-buy request
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-4">
          {homepageCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-[1.5rem] border border-[#101712]/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-xl font-black">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#1E2420]/70">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          <InfoCard
            title="Managed procurement, not an open marketplace"
            description="Buyers submit requests and OneFarmTech coordinates fulfilment, payment records, pickup, delivery and issue handling."
          />
          <InfoCard
            title="Built around WhatsApp"
            description="Ordering stays familiar while the operations desk manages records, receipts, group buys and buyer follow-up."
          />
          <InfoCard
            title="Designed for recurring buyers"
            description="Approved business buyers can be prepared for accounts, receipt history, payment tracking, credit limits and repeat ordering."
          />
        </div>
      </section>
    </main>
  );
}

function Metric({label, value}: {label: string; value: number}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-3xl font-black text-[#F2B84B]">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-white/70">{label}</p>
    </div>
  );
}

function GroupBuyRow({title, detail}: {title: string; detail: string}) {
  return (
    <div className="rounded-2xl border border-[#101712]/10 bg-[#F8F1E7] p-4">
      <h3 className="font-black">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-[#1E2420]/70">{detail}</p>
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
