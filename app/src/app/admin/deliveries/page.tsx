import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import StatusBadge from "@/components/admin/StatusBadge";
import {getDbOrders, formatOrderTotal} from "@/data/dbOrders";

const deliveryMethods = [
  "Platform delivery",
  "Scheduled delivery",
  "Pickup from listed location",
  "Pickup from office",
  "Customer arranged delivery",
];

const dispatchReadyStatuses = ["Packed", "Ready for dispatch", "Ready for pickup"];
const inTransitStatuses = ["Out for delivery"];
const completedStatuses = ["Delivered", "Completed"];
const exceptionStatuses = ["Issue reported", "Cancelled"];

export default async function DeliveriesPage() {
  const orders = await getDbOrders();

  const deliveryOrders = orders.filter((order) =>
    deliveryMethods.includes(order.deliveryMethod),
  );

  const readyOrders = deliveryOrders.filter((order) =>
    dispatchReadyStatuses.includes(order.fulfilmentStatus),
  );
  const inTransitOrders = deliveryOrders.filter((order) =>
    inTransitStatuses.includes(order.fulfilmentStatus),
  );
  const completedOrders = deliveryOrders.filter((order) =>
    completedStatuses.includes(order.fulfilmentStatus),
  );
  const exceptionOrders = deliveryOrders.filter((order) =>
    exceptionStatuses.includes(order.fulfilmentStatus),
  );

  return (
    <AdminPageShell
      title="Deliveries"
      description="Delivery and pickup control board for active OneFarmTech orders, dispatch readiness, exceptions, and closeout."
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-5">
          <Metric label="Delivery/pickup orders" value={String(deliveryOrders.length)} />
          <Metric label="Ready" value={String(readyOrders.length)} />
          <Metric label="Out for delivery" value={String(inTransitOrders.length)} />
          <Metric label="Completed" value={String(completedOrders.length)} />
          <Metric label="Exceptions" value={String(exceptionOrders.length)} />
        </div>

        <section className="grid gap-4 lg:grid-cols-4">
          <Bucket title="Ready for handoff" orders={readyOrders} />
          <Bucket title="In transit" orders={inTransitOrders} />
          <Bucket title="Completed" orders={completedOrders.slice(0, 8)} />
          <Bucket title="Exceptions" orders={exceptionOrders} />
        </section>

        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03]">
          <table className="min-w-[1000px] divide-y divide-white/10 text-sm">
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

              {!deliveryOrders.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-white/50">
                    No delivery or pickup orders yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Bucket({
  title,
  orders,
}: {
  title: string;
  orders: {
    id: string;
    code: string;
    buyerName: string;
    fulfilmentStatus: string;
    deliveryMethod: string;
  }[];
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 text-white">
      <h2 className="text-lg font-black">{title}</h2>
      <div className="mt-4 grid gap-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.code}`}
            className="rounded-2xl bg-white/[0.06] p-4 hover:bg-white/[0.1]"
          >
            <p className="font-bold text-[#9ee6ad]">{order.code}</p>
            <p className="mt-1 text-sm text-white/70">{order.buyerName}</p>
            <p className="mt-2 text-xs text-white/45">
              {order.fulfilmentStatus} · {order.deliveryMethod}
            </p>
          </Link>
        ))}

        {!orders.length ? (
          <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/45">
            No orders in this bucket.
          </p>
        ) : null}
      </div>
    </section>
  );
}
