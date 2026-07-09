import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PublicImageCollage from "@/components/PublicImageCollage";
import PublicMobileMenu from "@/components/PublicMobileMenu";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  const activeGroupBuyCount = await prisma.groupBuy.count({
    where: {
      status: {
        in: ["Open", "Minimum met"],
      },
    },
  });

  const reservedQuantity = activeGroupBuy?.reservedQuantity || 0;
  const targetQuantity = activeGroupBuy?.targetQuantity || 0;
  const progress =
    targetQuantity > 0
      ? Math.min(100, Math.round((reservedQuantity / targetQuantity) * 100))
      : 0;

  return {
    activeGroupBuy,
    activeGroupBuyCount,
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
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(242,184,75,0.22),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(31,122,63,0.16),transparent_34%),linear-gradient(180deg,#fbfff8_0%,#f5faef_58%,#fbfff8_100%)]">
        <PublicImageCollage
          images={[
            {
              src: "/backgrounds/produce.png",
              alt: "",
              className: "oft-float-slow left-[-120px] top-24 h-80 w-80 opacity-[0.46] blur-[0.2px] md:h-[28rem] md:w-[28rem]",
            },
            {
              src: "/backgrounds/trolley.png",
              alt: "",
              className: "oft-float-delay right-[-150px] top-28 h-80 w-80 opacity-[0.48] md:h-[30rem] md:w-[30rem]",
            },
            {
              src: "/backgrounds/buyers.png",
              alt: "",
              className: "oft-float-slow bottom-[-120px] left-[32%] hidden h-[28rem] w-[28rem] opacity-[0.46] lg:block",
            },
            {
              src: "/backgrounds/delivery.png",
              alt: "",
              className: "oft-float-delay bottom-[-130px] right-[8%] hidden h-[24rem] w-[24rem] opacity-[0.44] xl:block",
            },
          ]}
        />
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#1f7a3f] via-[#F2B84B] to-[#1f7a3f]" />
        <div className="oft-orb-drift absolute right-[-140px] top-20 h-[28rem] w-[28rem] rounded-full bg-[#1f7a3f]/14 blur-3xl" />
        <div className="oft-orb-drift-delay absolute left-[-160px] bottom-[-180px] h-[30rem] w-[30rem] rounded-full bg-[#F2B84B]/30 blur-3xl" />
        <div className="absolute left-1/2 top-24 h-40 w-[44rem] -translate-x-1/2 rounded-full bg-white/55 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
          <header className="flex items-center justify-between gap-6">
            <Link href="/" aria-label="Go to OneFarmTech homepage">
              <BrandMark />
            </Link>
            <nav className="hidden items-center gap-3 md:flex">
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
              <Link
                href="/delivery-partner/login"
                className="hidden rounded-full px-4 py-3 text-sm font-black text-[#101712] hover:bg-white lg:inline-flex"
              >
                Partner login
              </Link>
              <a
                href="https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20place%20a%20fresh%20food%20order."
                className="hidden rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f] md:inline-flex"
              >
                Order on WhatsApp
              </a>
            </nav>
            <PublicMobileMenu />
          </header>

          <div className="grid gap-10 py-14 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:py-20">
            <section>
              <div className="oft-fade-up inline-flex items-center gap-2 rounded-full border border-[#1f7a3f]/15 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f] shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-[#F2B84B]" />
                Fresh produce ordering, made simpler
              </div>

              <h1 className="oft-fade-up-delay-1 mt-6 max-w-4xl text-5xl font-black tracking-tight text-[#101712] md:text-7xl">
                Fresh food supply for buyers who need{" "}
                <span className="oft-highlight-sweep rounded-[1rem] bg-[#F2B84B] px-2 text-[#101712]">
                  better prices, quality and reliability.
                </span>
              </h1>

              <p className="oft-fade-up-delay-2 mt-6 max-w-2xl text-lg leading-8 text-[#1E2420]/75">
                OneFarmTech helps restaurants, retailers, caterers, households and buying
                groups order fresh produce, join bulk buys, track payments and receive receipts.
              </p>

              <div className="oft-fade-up-delay-3 mt-8 hidden flex-wrap items-center gap-3 md:flex">
                <a
                  href="https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20place%20a%20fresh%20food%20order.%20Buyer%20type%3A%20___%20Location%3A%20___%20Items%3A%20___"
                  className="oft-button-pop rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-[0_16px_40px_rgba(31,122,63,0.22)] hover:bg-[#155c2f]"
                >
                  Order on WhatsApp
                </a>
                <Link
                  href="/buyer-account-request"
                  className="oft-button-pop rounded-full border border-[#1f7a3f]/15 bg-white px-6 py-3 text-sm font-black text-[#1f7a3f] shadow-sm hover:bg-[#f3f8ef]"
                >
                  Request buyer account
                </Link>
              </div>

              <div className="oft-fade-up-delay-4 mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
                {[
                  "Restaurants, hotels and caterers",
                  "Food vendors and retailers",
                  "Homes and large households",
                  "Families, friends and neighbourhood groups",
                ].map((item) => (
                  <div
                    key={item}
                    className="oft-card-lift rounded-2xl border border-[#101712]/10 bg-white/90 px-4 py-3 text-sm font-bold shadow-sm backdrop-blur"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="oft-fade-up-delay-3 oft-hero-card-breathe rounded-[2rem] border border-[#101712]/10 bg-white/95 p-5 shadow-[0_30px_80px_rgba(16,23,18,0.16)] backdrop-blur">
              <div className="relative overflow-hidden rounded-[1.5rem] bg-[#101712] p-5 text-white">
                <div className="absolute right-[-80px] top-[-90px] h-56 w-56 rounded-full bg-[#1f7a3f]/35 blur-3xl" />
                <div className="absolute bottom-[-110px] left-[-90px] h-64 w-64 rounded-full bg-[#F2B84B]/20 blur-3xl" />
                <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-[#F2B84B]">
                      Group-buy window
                    </p>
                    <h2 className="mt-2 text-3xl font-black">
                      {activity.activeGroupBuy?.title || "Next group-buy window opening soon"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      {activity.item
                        ? `${activity.item.name} · ${activity.item.grade} · ${activity.item.unit}`
                        : "Group buys open manually on selected buying days."}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#1f7a3f] px-3 py-1 text-xs font-black text-white">
                    {activity.activeGroupBuy?.status || "Closed"}
                  </span>
                </div>

                <div className="mt-7">
                  <div className="flex items-center justify-between text-sm font-bold text-white/70">
                    <span>Reserved</span>
                    <span>{activity.progress}%</span>
                  </div>
                  <div className="mt-2 h-4 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="oft-progress-stripe oft-soft-pulse h-full rounded-full bg-[#F2B84B]"
                      style={{width: `${activity.progress}%`}}
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white/65">
                    {activity.targetQuantity > 0
                      ? `${activity.reservedQuantity} of ${activity.targetQuantity} reserved`
                      : "Group-buy reservations stay closed until the team opens the next buying window."}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <LiveMetric label="buyers joined" value={String(activity.reservationCount)} />
                  <LiveMetric label="open group buys" value={String(activity.activeGroupBuyCount)} />
                </div>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-[#1f7a3f]/10 bg-[#f3f8ef] p-5 shadow-sm">
                <h3 className="text-xl font-black">Group buying works for more than businesses.</h3>
                <p className="mt-2 text-sm leading-7 text-[#1E2420]/70">
                  Families, friends, neighbours, offices, communities and food businesses
                  can combine demand for better bulk buying.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <a
                  href="https://wa.me/?text=Hello%20OneFarmTech%2C%20I%20want%20to%20join%20or%20create%20a%20group%20buy."
                  className="oft-button-pop inline-flex items-center justify-center rounded-full bg-[#F2B84B] px-6 py-3 text-sm font-black text-[#101712] shadow-[0_18px_44px_rgba(242,184,75,0.32)] hover:bg-[#e4a833]"
                >
                  Register group-buy interest
                </a>
                <Link
                  href="/order"
                  className="inline-flex items-center justify-center rounded-full border border-[#101712]/10 bg-white px-5 py-3 text-sm font-black text-[#1f7a3f] shadow-sm hover:bg-[#fbfff8]"
                >
                  Start an order
                </Link>
              </div>
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
