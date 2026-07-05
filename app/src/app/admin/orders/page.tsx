import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import AdminDisclosure from "@/components/admin/AdminDisclosure";
import AdminTableShell from "@/components/admin/AdminTableShell";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import {getDbOrders, getOrderItemsSummary, formatOrderTotal} from "@/data/dbOrders";

function groupByFulfilment<T extends {fulfilmentStatus: string}>(orders: T[]) {
  return orders.reduce<Record<string, T[]>>((groups, order) => {
    const status = order.fulfilmentStatus || "Uncategorised";
    groups[status] = groups[status] || [];
    groups[status].push(order);
    return groups;
  }, {});
}

export default async function AdminOrdersPage() {
  const orders = await getDbOrders();

  const awaitingPayment = orders.filter((order) =>
    order.paymentStatus.toLowerCase().includes("unpaid"),
  );
  const paidOrApproved = orders.filter((order) =>
    ["paid", "approved"].some((word) => order.paymentStatus.toLowerCase().includes(word)),
  );
  const outForDelivery = orders.filter((order) =>
    ["delivery", "dispatch", "out"].some((word) =>
      order.fulfilmentStatus.toLowerCase().includes(word),
    ),
  );

  const orderStats = [
    {label: "Total orders", value: String(orders.length)},
    {label: "Awaiting payment", value: String(awaitingPayment.length)},
    {label: "Paid / approved", value: String(paidOrApproved.length)},
    {label: "Out for delivery", value: String(outForDelivery.length)},
  ];

  const groupedOrders = groupByFulfilment(orders);

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

      <AdminDisclosure title={`Order queue (${orders.length})`} defaultOpen>
        <AdminTableShell
          title="Order list"
          description="Database-backed order queue for active buyer orders."
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
              {orders.map((order) => (
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
                    <p className="font-semibold">{order.buyerName}</p>
                    <p className="text-xs text-[#405348]">{order.buyerType}</p>
                  </td>
                  <td className="px-4 py-4">{order.phone}</td>
                  <td className="px-4 py-4">{getOrderItemsSummary(order.items)}</td>
                  <td className="px-4 py-4">{order.orderType}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-4 py-4">{order.fulfilmentStatus}</td>
                  <td className="px-4 py-4 font-semibold">
                    {formatOrderTotal(order.estimatedTotal)}
                  </td>
                  <td className="px-4 py-4">{order.deliveryMethod}</td>
                  <td className="rounded-r-2xl px-4 py-4">
                    {order.createdAt.toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}

              {orders.length === 0 ? (
                <tr>
                  <td className="rounded-2xl bg-[#f7f5ec] px-4 py-6 text-sm text-[#405348]" colSpan={10}>
                    No orders yet. Use Create order to add the first database-backed order.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </AdminTableShell>
      </AdminDisclosure>

      <AdminDisclosure
        title={`Orders by fulfilment status (${Object.keys(groupedOrders).length})`}
        defaultOpen={false}
      >
        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-black">Fulfilment status view</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
            Use this grouped view to scan operational movement from new order to sourcing, delivery, pickup or completion.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {Object.entries(groupedOrders).map(([status, statusOrders]) => (
              <div
                key={status}
                className="rounded-3xl border border-[#102015]/10 bg-[#f7f5ec] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{status}</h3>
                    <p className="mt-1 text-sm text-[#405348]">
                      {statusOrders.length} order{statusOrders.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {statusOrders.slice(0, 8).map((order) => (
                    <Link
                      key={order.code}
                      href={`/admin/orders/${order.code}`}
                      className="rounded-2xl bg-white p-4 text-sm transition hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-[#1f7a3f]">{order.code}</p>
                          <p className="mt-1 font-semibold text-[#102015]">{order.buyerName}</p>
                          <p className="mt-1 text-xs text-[#405348]">
                            {order.deliveryMethod} · {formatOrderTotal(order.estimatedTotal)}
                          </p>
                        </div>
                        <StatusBadge status={order.paymentStatus} />
                      </div>
                    </Link>
                  ))}

                  {statusOrders.length > 8 ? (
                    <p className="rounded-2xl bg-white p-4 text-xs font-bold text-[#405348]">
                      +{statusOrders.length - 8} more orders in this status.
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            {orders.length === 0 ? (
              <p className="rounded-2xl bg-[#f7f5ec] p-5 text-sm font-semibold text-[#405348]">
                No orders yet.
              </p>
            ) : null}
          </div>
        </section>
      </AdminDisclosure>
    </AdminShell>
  );
}
