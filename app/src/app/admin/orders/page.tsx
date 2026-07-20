import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import AdminDisclosure from "@/components/admin/AdminDisclosure";
import {
  AdminCompactMetric,
  AdminStatusPill,
  AdminViewBar,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import {getDbOrders, getOrderItemsSummary, formatOrderTotal} from "@/data/dbOrders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type OrdersPageProps = {
  searchParams?: Promise<{
    view?: string;
    status?: string;
    sort?: string;
  }>;
};

function groupByFulfilment<T extends {fulfilmentStatus: string}>(orders: T[]) {
  return orders.reduce<Record<string, T[]>>((groups, order) => {
    const status = order.fulfilmentStatus || "Uncategorised";
    groups[status] = groups[status] || [];
    groups[status].push(order);
    return groups;
  }, {});
}

function hrefFor(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }

  const query = search.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

export default async function AdminOrdersPage({searchParams}: OrdersPageProps) {
  const params = await searchParams;
  const view = params?.view || "list";
  const status = params?.status || "all";
  const sort = params?.sort || "newest";
  const orders = await getDbOrders();

  const awaitingPayment = orders.filter((order) =>
    order.paymentStatus.toLowerCase().includes("unpaid") ||
    order.paymentStatus.toLowerCase().includes("pending"),
  );
  const paidOrApproved = orders.filter((order) =>
    ["paid", "approved"].some((word) => order.paymentStatus.toLowerCase().includes(word)),
  );
  const outForDelivery = orders.filter((order) =>
    ["delivery", "dispatch", "out", "transit"].some((word) =>
      order.fulfilmentStatus.toLowerCase().includes(word),
    ),
  );

  const filteredOrders = orders.filter((order) => {
    const key = `${order.paymentStatus} ${order.fulfilmentStatus}`.toLowerCase();

    if (status === "all") return true;
    if (status === "awaiting-payment") return key.includes("unpaid") || key.includes("pending");
    if (status === "paid") return key.includes("paid") || key.includes("approved");
    if (status === "delivery") return key.includes("delivery") || key.includes("dispatch") || key.includes("transit") || key.includes("out");
    if (status === "issues") return key.includes("issue") || key.includes("failed") || key.includes("cancelled");
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
    if (sort === "value-high") return b.estimatedTotal - a.estimatedTotal;
    if (sort === "value-low") return a.estimatedTotal - b.estimatedTotal;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const groupedOrders = groupByFulfilment(sortedOrders);

  const base = {view, status, sort};

  return (
    <AdminShell
      title="Orders"
      description="Full order database with compact views, filters and sorting for staff operations."
      compactHeader
      action={
        <Link
          href="/admin/create-order"
          className="rounded-full bg-[#1f7a3f] px-5 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
        >
          New order
        </Link>
      }
    >
      <section className="mt-8 grid gap-3 md:grid-cols-4">
        <AdminCompactMetric label="Total orders" value={String(orders.length)} tone="blue" />
        <AdminCompactMetric label="Awaiting payment" value={String(awaitingPayment.length)} tone="amber" href={hrefFor({...base, status: "awaiting-payment"})} />
        <AdminCompactMetric label="Paid / approved" value={String(paidOrApproved.length)} tone="green" href={hrefFor({...base, status: "paid"})} />
        <AdminCompactMetric label="Out for delivery" value={String(outForDelivery.length)} tone="blue" href={hrefFor({...base, status: "delivery"})} />
      </section>

      <AdminViewBar
        title="Order controls"
        description={`${sortedOrders.length} order${sortedOrders.length === 1 ? "" : "s"} shown. Use filters before scrolling.`}
        viewOptions={[
          {label: "List", href: hrefFor({...base, view: "list"}), active: view === "list"},
          {label: "Compact", href: hrefFor({...base, view: "compact"}), active: view === "compact"},
          {label: "Board", href: hrefFor({...base, view: "board"}), active: view === "board"},
        ]}
        filterOptions={[
          {label: "All", href: hrefFor({...base, status: "all"}), active: status === "all"},
          {label: "Awaiting payment", href: hrefFor({...base, status: "awaiting-payment"}), active: status === "awaiting-payment"},
          {label: "Paid", href: hrefFor({...base, status: "paid"}), active: status === "paid"},
          {label: "Delivery", href: hrefFor({...base, status: "delivery"}), active: status === "delivery"},
          {label: "Issues", href: hrefFor({...base, status: "issues"}), active: status === "issues"},
        ]}
        sortOptions={[
          {label: "Newest", href: hrefFor({...base, sort: "newest"}), active: sort === "newest"},
          {label: "Oldest", href: hrefFor({...base, sort: "oldest"}), active: sort === "oldest"},
          {label: "Value high", href: hrefFor({...base, sort: "value-high"}), active: sort === "value-high"},
          {label: "Value low", href: hrefFor({...base, sort: "value-low"}), active: sort === "value-low"},
        ]}
      />

      {view === "board" ? (
        <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {Object.entries(groupedOrders).map(([groupStatus, statusOrders]) => (
            <div key={groupStatus} className="rounded-2xl border border-[#102015]/10 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-black text-[#102015]">{groupStatus}</h2>
                <AdminStatusPill tone={adminToneFromStatus(groupStatus)}>
                  {statusOrders.length}
                </AdminStatusPill>
              </div>

              <div className="mt-4 grid gap-2">
                {statusOrders.slice(0, 12).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="rounded-xl border border-[#102015]/10 bg-[#fbfff8] px-3 py-3 text-sm transition hover:bg-[#f3f8ef]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-[#1f7a3f]">{order.code}</p>
                        <p className="mt-1 font-semibold text-[#102015]">{order.buyerName}</p>
                        <p className="mt-1 text-xs text-[#405348]">
                          {order.deliveryMethod} · {formatOrderTotal(order.estimatedTotal)}
                        </p>
                      </div>
                      <AdminStatusPill tone={adminToneFromStatus(order.paymentStatus)}>
                        {order.paymentStatus}
                      </AdminStatusPill>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <AdminDisclosure title={`Order queue (${sortedOrders.length})`} defaultOpen>
          <section className="overflow-hidden rounded-2xl border border-[#102015]/10 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-[#f3f8ef] text-xs uppercase tracking-[0.14em] text-[#405348]">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Buyer</th>
                    {view === "list" ? <th className="px-4 py-3">Contact</th> : null}
                    {view === "list" ? <th className="px-4 py-3">Items</th> : null}
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Fulfilment</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Delivery</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedOrders.map((order) => (
                    <tr key={order.id} className="border-t border-[#102015]/10 text-[#405348]">
                      <td className="px-4 py-3 font-black text-[#102015]">
                        <Link href={`/admin/orders/${order.id}`} className="text-[#1f7a3f] underline-offset-4 hover:underline">
                          {order.code}
                        </Link>
                        {view === "list" ? <p className="mt-1 text-xs text-[#587063]">{order.orderType}</p> : null}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#102015]">{order.buyerName}</p>
                        <p className="text-xs text-[#587063]">{order.buyerType}</p>
                      </td>
                      {view === "list" ? <td className="px-4 py-3">{order.phone}</td> : null}
                      {view === "list" ? <td className="max-w-[18rem] truncate px-4 py-3">{getOrderItemsSummary(order.items)}</td> : null}
                      <td className="px-4 py-3">
                        <AdminStatusPill tone={adminToneFromStatus(order.paymentStatus)}>
                          {order.paymentStatus}
                        </AdminStatusPill>
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusPill tone={adminToneFromStatus(order.fulfilmentStatus)}>
                          {order.fulfilmentStatus}
                        </AdminStatusPill>
                      </td>
                      <td className="px-4 py-3 font-black text-[#102015]">
                        {formatOrderTotal(order.estimatedTotal)}
                      </td>
                      <td className="px-4 py-3">{order.deliveryMethod}</td>
                      <td className="px-4 py-3">{order.createdAt.toLocaleDateString("en-GB")}</td>
                    </tr>
                  ))}

                  {sortedOrders.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#587063]" colSpan={view === "list" ? 9 : 7}>
                        No orders match this view.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </AdminDisclosure>
      )}
    </AdminShell>
  );
}
