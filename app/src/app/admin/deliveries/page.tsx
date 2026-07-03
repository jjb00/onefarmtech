import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import StatusBadge from "@/components/admin/StatusBadge";
import { getDbOrders, formatOrderTotal } from "@/data/dbOrders";

export default async function DeliveriesPage() {
  const orders = await getDbOrders();

  const deliveryOrders = orders.filter((order) =>
    [
      "Platform delivery",
      "Scheduled delivery",
      "Pickup from listed location",
      "Pickup from office",
      "Customer arranged delivery",
    ].includes(order.deliveryMethod)
  );

  return (
    <AdminPageShell
      title="Deliveries"
      description="Database-backed delivery and pickup board for active OneFarmTech orders."
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white">
            <p className="text-sm text-white/50">Delivery orders</p>
            <p className="mt-2 text-3xl font-black">{deliveryOrders.length}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white">
            <p className="text-sm text-white/50">Out for delivery</p>
            <p className="mt-2 text-3xl font-black">
              {orders.filter((order) => order.fulfilmentStatus === "Out for delivery").length}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white">
            <p className="text-sm text-white/50">Ready for dispatch</p>
            <p className="mt-2 text-3xl font-black">
              {orders.filter((order) => order.fulfilmentStatus === "Ready for dispatch").length}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white">
            <p className="text-sm text-white/50">Delivered/completed</p>
            <p className="mt-2 text-3xl font-black">
              {
                orders.filter((order) =>
                  ["Delivered", "Completed"].includes(order.fulfilmentStatus)
                ).length
              }
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-[0.18em] text-white/45">
              <tr>
                <th className="px-5 py-4 font-semibold">Order</th>
                <th className="px-5 py-4 font-semibold">Buyer</th>
                <th className="px-5 py-4 font-semibold">Delivery method</th>
                <th className="px-5 py-4 font-semibold">Delivery note</th>
                <th className="px-5 py-4 font-semibold">Total</th>
                <th className="px-5 py-4 font-semibold">Fulfilment</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {deliveryOrders.map((order) => (
                <tr key={order.id} className="text-white/75">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/orders/${order.code}`}
                      className="font-semibold text-[#9ee6ad] hover:underline"
                    >
                      {order.code}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{order.buyerName}</div>
                    <div className="text-xs text-white/45">{order.phone}</div>
                  </td>
                  <td className="px-5 py-4">{order.deliveryMethod}</td>
                  <td className="px-5 py-4">
                    {order.deliveryNote || "No delivery note"}
                  </td>
                  <td className="px-5 py-4">{formatOrderTotal(order.estimatedTotal)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.fulfilmentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}
