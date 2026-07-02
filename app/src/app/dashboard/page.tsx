import Link from "next/link";
import PublicPageShell from "@/components/PublicPageShell";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const recentOrders = [
  {
    code: "OFT-0002",
    item: "Irish potatoes - 10kg",
    type: "Group-buy",
    payment: "Fully paid",
    status: "Minimum met",
    delivery: "Pickup point",
    total: "₦22,000",
  },
  {
    code: "OFT-0005",
    item: "Rice, beans, garri",
    type: "Direct order",
    payment: "Unpaid",
    status: "Awaiting confirmation",
    delivery: "Home delivery",
    total: "₦145,000",
  },
];

const openGroupBuys = [
  {
    title: "Irish Potatoes Split",
    progress: "38kg of 50kg committed",
    closes: "Friday 5pm",
    delivery: "Saturday pickup",
  },
  {
    title: "Tomato Basket Group-buy",
    progress: "7 of 12 baskets committed",
    closes: "Wednesday 6pm",
    delivery: "Thursday delivery",
  },
];

const dashboardCards = [
  {
    title: "Order history",
    description: "View past and active orders.",
  },
  {
    title: "Invoices",
    description: "Download receipts and payment records.",
  },
  {
    title: "Recurring supply",
    description: "Request weekly or scheduled produce supply.",
  },
];

function paymentClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("paid")) {
    return "bg-[#e7f3df] text-[#1f7a3f]";
  }

  return "bg-[#fff1d6] text-[#8a5a00]";
}

export default function DashboardPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1f7a3f]">
              Buyer dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold md:text-5xl">
              Manage your OneFarmTech orders
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#405348]">
              Track orders, join group-buys, review invoices, and request
              recurring supply for your household or business.
            </p>
          </div>

          <Link
            href="/login"
            className="rounded-full border border-[#1f7a3f] px-5 py-3 text-center text-sm font-semibold text-[#1f7a3f]"
          >
            Buyer login coming soon
          </Link>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {dashboardCards.map((card) => (
            <div key={card.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">{card.title}</h2>
              <p className="mt-3 leading-6 text-[#405348]">{card.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Recent orders</h2>
                <p className="mt-2 text-sm text-[#405348]">
                  Mock buyer order history for testing.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {recentOrders.map((order) => (
                <div
                  key={order.code}
                  className="rounded-2xl border border-[#edf0e8] bg-[#f7f5ec] p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1f7a3f]">
                        {order.code}
                      </p>
                      <h3 className="mt-1 text-xl font-bold">{order.item}</h3>
                      <p className="mt-2 text-sm text-[#405348]">
                        {order.type} · {order.delivery}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="font-bold">{order.total}</p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paymentClass(
                          order.payment
                        )}`}
                      >
                        {order.payment}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-[#405348]">
                    Status: <span className="font-semibold">{order.status}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#102015] p-6 text-white shadow-sm">
            <h2 className="text-2xl font-bold">Open group-buys</h2>
            <p className="mt-2 text-sm text-[#d8e8dc]">
              Join admin-created bulk split offers.
            </p>

            <div className="mt-6 grid gap-4">
              {openGroupBuys.map((groupBuy) => (
                <div key={groupBuy.title} className="rounded-2xl bg-white/10 p-5">
                  <h3 className="font-bold">{groupBuy.title}</h3>
                  <p className="mt-2 text-sm text-[#d8e8dc]">
                    {groupBuy.progress}
                  </p>
                  <p className="mt-2 text-sm text-[#d8e8dc]">
                    Closes: {groupBuy.closes}
                  </p>
                  <p className="mt-2 text-sm text-[#d8e8dc]">
                    {groupBuy.delivery}
                  </p>
                  <a
                    href={buildWhatsAppLink()}
                    className="mt-4 inline-flex rounded-full bg-[#9ee6ad] px-4 py-2 text-sm font-semibold text-[#102015]"
                  >
                    Join via WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </PublicPageShell>
  );
}
