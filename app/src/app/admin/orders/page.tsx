import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import AdminTableShell from "@/components/admin/AdminTableShell";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { mockOrders } from "@/data/mockOrders";

const orderStats = [
  { label: "Total orders", value: "24" },
  { label: "Awaiting payment", value: "6" },
  { label: "Ready to source", value: "9" },
  { label: "Out for delivery", value: "3" },
];

export default function AdminOrdersPage() {
  return (
    <AdminShell
      title="Orders"
      description="Track WhatsApp orders, group-buy orders, direct orders, payment status, fulfilment stage, and delivery method."
      action={
        <Link
          href="/admin/create-order"
          className="rounded-full bg-[#9ee6ad] px-6 py-4 text-center font-semibold text-[#102015]"
        >
          Create new order
        </Link>
      }
    >
      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {orderStats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </section>

      <AdminTableShell
        title="Order queue"
        description="MVP mock table. Later this will connect to database records."
        label="Manual order management"
      >
        <table className="w-full min-w-[1000px] border-separate border-spacing-y-3 text-left text-sm">
          <thead>
            <tr className="text-[#405348]">
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Buyer</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Items</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Payment</th>
              <th className="px-4 py-2">Fulfilment</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Delivery</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>

          <tbody>
            {mockOrders.map((order) => (
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
                <td className="px-4 py-4">{order.phone}</td>
                <td className="px-4 py-4">{order.items}</td>
                <td className="px-4 py-4">{order.orderType}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={order.paymentStatus} />
                </td>
                <td className="px-4 py-4">{order.fulfilmentStatus}</td>
                <td className="px-4 py-4 font-semibold">{order.total}</td>
                <td className="px-4 py-4">{order.delivery}</td>
                <td className="rounded-r-2xl px-4 py-4">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </AdminShell>
  );
}
