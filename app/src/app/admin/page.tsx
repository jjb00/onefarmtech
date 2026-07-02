import Link from "next/link";
import AdminLayoutFrame from "@/components/admin/AdminLayoutFrame";
import AdminModuleNav from "@/components/admin/AdminModuleNav";
import AdminTableShell from "@/components/admin/AdminTableShell";
import AdminHealthGrid from "@/components/admin/AdminHealthGrid";
import OperationalTimeline from "@/components/admin/OperationalTimeline";
import QuickActionsGrid from "@/components/admin/QuickActionsGrid";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { mockOrders, mockStats } from "@/data/mockOrders";

const dashboardMetrics = [
  ...mockStats,
  { label: "Draft workflow", value: "Local" },
];

export default function AdminPage() {
  return (
    <AdminLayoutFrame
      title="OneFarmTech Admin"
      description="Operations centre for managing orders, customers, sourcing, payments, group-buys, deliveries, pickup points, complaints, and workflow rules."
      action={
        <Link
          href="/admin/create-order"
          className="rounded-full bg-[#9ee6ad] px-6 py-4 text-center font-semibold text-[#102015]"
        >
          Create order
        </Link>
      }
    >
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {dashboardMetrics.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </section>

      <QuickActionsGrid />

      <section className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminTableShell
          title="Recent orders"
          description="Latest mock order data for testing the admin workflow before database integration."
          label="View all orders"
        >
          <table className="w-full min-w-[900px] border-separate border-spacing-y-3 text-left text-sm">
            <thead>
              <tr className="text-[#405348]">
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Buyer</th>
                <th className="px-4 py-2">Items</th>
                <th className="px-4 py-2">Payment</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Delivery</th>
              </tr>
            </thead>

            <tbody>
              {mockOrders.slice(0, 4).map((order) => (
                <tr key={order.code} className="rounded-2xl bg-[#f7f5ec]">
                  <td className="rounded-l-2xl px-4 py-4 font-bold">
                    <Link
                      href={`/admin/orders/${order.code}`}
                      className="underline decoration-[#1f7a3f] underline-offset-4"
                    >
                      {order.code}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold">{order.buyer}</p>
                    <p className="text-xs text-[#405348]">{order.buyerType}</p>
                  </td>
                  <td className="px-4 py-4">{order.items}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-4 py-4 font-semibold">{order.total}</td>
                  <td className="rounded-r-2xl px-4 py-4">{order.delivery}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>

        <AdminHealthGrid />
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <OperationalTimeline />

        <section className="rounded-[2rem] bg-white/10 p-6">
          <h2 className="text-2xl font-bold">Admin modules</h2>
          <p className="mt-2 text-sm leading-6 text-[#d8e8dc]">
            The admin area is now grouped into Orders, Supply, Operations, and
            Commercial modules.
          </p>
          <AdminModuleNav />
        </section>
      </section>
    </AdminLayoutFrame>
  );
}
