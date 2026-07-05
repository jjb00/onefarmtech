import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicImageCollage from "@/components/PublicImageCollage";
import {prisma} from "@/lib/prisma";

async function getHomepageActivity() {
  const activeGroupBuy = await prisma.groupBuy.findFirst({
    where: {
      status: {
        in: ["Open", "Minimum met"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: true,
      reservations: true,
    },
  });

  const [activeGroupBuyCount, todayOrderCount] = await Promise.all([
    prisma.groupBuy.count({
      where: {
        status: {
          in: ["Open", "Minimum met"],
        },
      },
    }),
    prisma.order.count(),
  ]);

  const reservedQuantity = activeGroupBuy?.reservedQuantity || 0;
  const targetQuantity = activeGroupBuy?.targetQuantity || 0;
  const progress =
    targetQuantity > 0
      ? Math.min(100, Math.round((reservedQuantity / targetQuantity) * 100))
      : 0;

  return {
    activeGroupBuy,
    activeGroupBuyCount,
    todayOrderCount,
    reservedQuantity,
    targetQuantity,
    progress,
    reservationCount: activeGroupBuy?.reservations.length || 0,
    item: activeGroupBuy?.items[0],
  };
}

export default async function HomePage() {
  const activity = await getHomepageActivity();

  return (
    <main className="min-h-screen bg-[#fbfff8] text-[#101712]">
      <section className="relative overflow-hidden">
        <PublicImageCollage
          images={[
            {
              src: "/backgrounds/produce.png",
              alt: "Fresh produce supply background",
              className: "left-[-120px] top-24 h-80 w-80 opacity-[0.36] blur-[0.2px] md:h-[28rem] md:w-[28rem]",
            },
            {
              src: "/backgrounds/trolley.png",
              alt: "Fresh produce trolley",
              className: "right-[-150px] top-28 h-80 w-80 opacity-[0.38] md:h-[30rem] md:w-[30rem]",
            },
            {
              src: "/backgrounds/buyers.png",
              alt: "Nigerian fresh food buyer categories",
              className: "bottom-[-120px] left-[32%] hidden h-[28rem] w-[28rem] opacity-[0.38] lg:block",
            },
            {
              src: "/backgrounds/delivery.png",
              alt: "Fresh produce delivery and fulfilment",
              className: "bottom-[-130px] right-[8%] hidden h-[24rem] w-[24rem] opacity-[0.37] xl:block",
            },
          ]}
        />
        <div className="absolute inset-x-0 top-0 h-2 bg-[#1f7a3f]" />
        <div className="absolute right-[-140px] top-20 h-[28rem] w-[28rem] rounded-full bg-[#1f7a3f]/10 blur-3xl" />
        <div className="absolute left-[-160px] bottom-[-180px] h-[30rem] w-[30rem] rounded-full bg-[#F2B84B]/25 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
          <header className="flex items-center justify-between gap-6">
            <Link href="/" aria-label="Go to OneFarmTech homepage">
              <BrandMark />
            </Link>
            <nav className="flex items-center gap-3">
              <Link
                href="/faq"
                className="hidden rounded-full px-4 py-3 text-sm font-black text-[#101712] hover:bg-white md:inline-flex"
              >
                FAQ
              </Link>
              <Link
                href="/buyer-account-request"
                className="hidden rounded-full border border-[#101712]/10 bg-white px-5 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-[#f3f8ef] md:inline-flex"
              >
                Create buyer account
              </Link>
              <Link
                href="/contact"
                className="hidden rounded-full px-4 py-3 text-sm font-black text-[#101712] hover:bg-white lg:inline-flex"
              >
                Contact
              </Link>
              <a
                href="https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20place%20a%20fresh%20food%20order."
                className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
              >
                Start an order
              </a>
            </nav>
          </header>
          <div data-testid="mobile-launch-cta-row" className="mt-5 grid grid-cols-2 gap-3 md:hidden">
            <Link
              href="/order-request"
              className="rounded-full bg-[#1f7a3f] px-4 py-3 text-center text-sm font-black text-white shadow-sm"
            >
              Order
            </Link>
            <Link
              href="/buyer-account-request"
              className="rounded-full border border-[#101712]/10 bg-white/85 px-4 py-3 text-center text-sm font-black text-[#101712] shadow-sm"
            >
              Buyer account
            </Link>
          </div>

          <div className="grid gap-10 py-14 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:py-20">
            <section>
              <h1 className="oft-fade-up max-w-4xl text-5xl font-black tracking-tight text-[#101712] md:text-7xl">
                Fresh food supply for buyers who need better prices, quality and reliability.
              </h1>

              <p className="oft-fade-up-delay-1 mt-6 max-w-2xl text-lg leading-8 text-[#1E2420]/75">
                OneFarmTech helps restaurants, retailers, caterers, households and buying
                groups order fresh produce, join bulk buys, track payments and receive receipts.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20place%20a%20fresh%20food%20order.%20Buyer%20type%3A%20___%20Location%3A%20___%20Items%3A%20___"
                  className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
                >
                  Order fresh produce
                </a>
                <a
                  href="https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20join%20or%20create%20a%20group%20buy.%20Group%20type%3A%20family%2Ffriends%2Fcity%2Fbusiness.%20Location%3A%20___%20Items%3A%20___"
                  className="rounded-full border border-[#101712]/10 bg-white px-6 py-3 text-sm font-black text-[#101712] shadow-sm hover:bg-[#f3f8ef]"
                >
                  Join or create group buy
                </a>
              </div>

              <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
                {[
                  "Restaurants, hotels and caterers",
                  "Food vendors and retailers",
                  "Homes and large households",
                  "Families, friends and neighbourhood groups",
                ].map((item) => (
                  <div
                    key={item}
                    className="oft-card-lift rounded-2xl border border-[#101712]/10 bg-white px-4 py-3 text-sm font-bold shadow-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="oft-fade-up-delay-2 rounded-[2rem] border border-[#101712]/10 bg-white/95 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-[1.5rem] bg-[#101712] p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-[#F2B84B]">
                      Live group-buy progress
                    </p>
                    <h2 className="mt-2 text-3xl font-black">
                      {activity.activeGroupBuy?.title || "Next bulk buy opening soon"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      {activity.item
                        ? `${activity.item.name} · ${activity.item.grade} · ${activity.item.unit}`
                        : "City, family, friends and business group buying."}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#1f7a3f] px-3 py-1 text-xs font-black text-white">
                    {activity.activeGroupBuy?.status || "Open"}
                  </span>
                </div>

                <div className="mt-7">
                  <div className="flex items-center justify-between text-sm font-bold text-white/70">
                    <span>Reserved</span>
                    <span>{activity.progress}%</span>
                  </div>
                  <div className="mt-2 h-4 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="oft-soft-pulse h-full rounded-full bg-[#F2B84B]"
                      style={{width: `${activity.progress}%`}}
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white/65">
                    {activity.targetQuantity > 0
                      ? `${activity.reservedQuantity} of ${activity.targetQuantity} reserved`
                      : "Reservations will show here once a group buy is active."}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <LiveMetric label="buyers joined" value={String(activity.reservationCount)} />
                  <LiveMetric label="active group buys" value={String(activity.activeGroupBuyCount)} />
                  <LiveMetric label="orders in system" value={String(activity.todayOrderCount)} />
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-[#f3f8ef] p-5">
                <h3 className="text-xl font-black">Group buying works for more than businesses.</h3>
                <p className="mt-2 text-sm leading-7 text-[#1E2420]/70">
                  Families, friends, neighbours, offices, communities and food businesses
                  can combine demand for better bulk buying.
                </p>
              </div>

              <a
                href="https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20join%20or%20create%20a%20group%20buy."
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#F2B84B] px-5 py-3 text-sm font-black text-[#101712] hover:brightness-95"
              >
                Join or create group buy
              </a>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function LiveMetric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-2xl font-black text-[#F2B84B]">{value}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-white/65">{label}</p>
    </div>
  );
}
