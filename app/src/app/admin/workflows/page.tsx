import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import StatusBadge from "@/components/admin/StatusBadge";
import { getDbOrders, formatOrderTotal } from "@/data/dbOrders";
import { orderWorkflowSteps } from "@/constants/orderOptions";

const workflowGroups = [
  {
    title: "New / confirmation",
    statuses: ["New order", "Awaiting customer confirmation"],
  },
  {
    title: "Sourcing",
    statuses: ["Approved for sourcing", "Sourcing", "Awaiting harvest"],
  },
  {
    title: "Quality / packing",
    statuses: ["Picked up", "Quality checked", "Packed", "Ready for dispatch"],
  },
  {
    title: "Delivery / closeout",
    statuses: ["Out for delivery", "Delivered", "Completed"],
  },
  {
    title: "Exceptions",
    statuses: ["Issue reported", "Cancelled"],
  },
];

export default async function WorkflowsPage() {
  const orders = await getDbOrders();

  return (
    <AdminPageShell
      title="Workflows"
      description="Database-backed workflow board for admin order progression, sourcing, delivery, and issue handling."
    >
      <div className="grid gap-8">
        <section className="grid gap-4 md:grid-cols-5">
          {workflowGroups.map((group) => {
            const count = orders.filter((order) =>
              group.statuses.includes(order.fulfilmentStatus)
            ).length;

            return (
              <div
                key={group.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white"
              >
                <p className="text-sm text-white/50">{group.title}</p>
                <p className="mt-2 text-3xl font-black">{count}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-5">
          {workflowGroups.map((group) => {
            const groupOrders = orders.filter((order) =>
              group.statuses.includes(order.fulfilmentStatus)
            );

            return (
              <div
                key={group.title}
                className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 text-white"
              >
                <h2 className="text-lg font-bold">{group.title}</h2>
                <p className="mt-1 text-xs text-white/45">
                  {group.statuses.join(", ")}
                </p>

                <div className="mt-5 grid gap-3">
                  {groupOrders.length === 0 ? (
                    <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/45">
                      No orders here.
                    </p>
                  ) : (
                    groupOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.code}`}
                        className="rounded-2xl bg-white/[0.06] p-4 transition hover:bg-white/[0.1]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-[#9ee6ad]">{order.code}</p>
                            <p className="mt-1 text-sm text-white/70">
                              {order.buyerName}
                            </p>
                          </div>
                          <StatusBadge status={order.paymentStatus} />
                        </div>

                        <p className="mt-3 text-sm text-white/50">
                          {formatOrderTotal(order.estimatedTotal)}
                        </p>
                        <p className="mt-2 text-xs text-white/45">
                          {order.deliveryMethod}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 text-white">
          <h2 className="text-2xl font-bold">Operating workflow</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {orderWorkflowSteps.map((step, index) => (
              <div key={step} className="rounded-2xl bg-white/[0.05] p-4">
                <p className="text-sm font-bold text-[#9ee6ad]">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm text-white/70">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
