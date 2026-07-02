import Link from "next/link";
import { mockOrders, mockStats, paymentStatusClass } from "@/data/mockOrders";

const moduleCards = [
  {
    title: "Orders",
    href: "/admin/orders",
    description: "Track order queue, payments, sourcing, and delivery status.",
  },
  {
    title: "Customers",
    href: "/admin/customers",
    description: "Manage buyer profiles, credit terms, and business accounts.",
  },
  {
    title: "Products",
    href: "/admin/products",
    description: "Manage produce categories, units, grades, and availability.",
  },
  {
    title: "Farmers & suppliers",
    href: "/admin/suppliers",
    description: "Track trusted rural suppliers, harvest notes, and reliability.",
  },
  {
    title: "Group-buys",
    href: "/admin/group-buys",
    description: "Create and monitor split bulk-buy opportunities.",
  },
  {
    title: "Deliveries",
    href: "/admin/deliveries",
    description: "Manage pickup points, delivery methods, and dispatch status.",
  },
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#102015] px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-[#9ee6ad]">
              ← Back to public site
            </Link>

            <h1 className="mt-6 text-4xl font-bold">OneFarmTech Admin</h1>

            <p className="mt-3 max-w-3xl text-[#d8e8dc]">
              Operations centre for managing orders, customers, sourcing,
              payments, group-buys, deliveries, and complaints.
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="rounded-full bg-[#9ee6ad] px-6 py-4 text-center font-semibold text-[#102015]"
          >
            View orders
          </Link>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {mockStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/10 p-6">
              <p className="text-sm text-[#d8e8dc]">{stat.label}</p>
              <p className="mt-2 text-4xl font-bold">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {moduleCards.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="rounded-2xl bg-white/10 p-6 transition hover:bg-white/15"
            >
              <h2 className="text-xl font-bold text-white">{module.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#d8e8dc]">
                {module.description}
              </p>
            </Link>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Recent orders</h2>
              <p className="mt-2 text-sm text-[#405348]">
                Latest mock order data for testing the first admin workflow.
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="rounded-full bg-[#f7f5ec] px-4 py-2 text-sm font-semibold text-[#405348]"
            >
              View all orders
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-y-3 text-left text-sm">
              <thead>
                <tr className="text-[#405348]">
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Buyer</th>
                  <th className="px-4 py-2">Items</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Payment</th>
                  <th className="px-4 py-2">Fulfilment</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Delivery</th>
                </tr>
              </thead>

              <tbody>
                {mockOrders.slice(0, 4).map((order) => (
                  <tr key={order.code} className="rounded-2xl bg-[#f7f5ec]">
                    <td className="rounded-l-2xl px-4 py-4 font-bold">
                      {order.code}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{order.buyer}</p>
                      <p className="text-xs text-[#405348]">{order.buyerType}</p>
                    </td>
                    <td className="px-4 py-4">{order.items}</td>
                    <td className="px-4 py-4">{order.orderType}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusClass(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">{order.fulfilmentStatus}</td>
                    <td className="px-4 py-4 font-semibold">{order.total}</td>
                    <td className="rounded-r-2xl px-4 py-4">{order.delivery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
