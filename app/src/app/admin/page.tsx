import Link from "next/link";
import AdminModuleNav from "@/components/admin/AdminModuleNav";
import AdminTableShell from "@/components/admin/AdminTableShell";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { mockOrders, mockStats } from "@/data/mockOrders";

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
            href="/admin/create-order"
            className="rounded-full bg-[#9ee6ad] px-6 py-4 text-center font-semibold text-[#102015]"
          >
            Create order
          </Link>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {mockStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </section>

        <AdminModuleNav />

        <AdminTableShell
          title="Recent orders"
          description="Latest mock order data for testing the first admin workflow."
          label="View all orders"
        >
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
                    <Link href={`/admin/orders/${order.code}`} className="underline decoration-[#1f7a3f] underline-offset-4">
                      {order.code}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold">{order.buyer}</p>
                    <p className="text-xs text-[#405348]">{order.buyerType}</p>
                  </td>
                  <td className="px-4 py-4">{order.items}</td>
                  <td className="px-4 py-4">{order.orderType}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-4 py-4">{order.fulfilmentStatus}</td>
                  <td className="px-4 py-4 font-semibold">{order.total}</td>
                  <td className="rounded-r-2xl px-4 py-4">{order.delivery}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      </section>
    </main>
  );
}
