import AdminShell from "@/components/admin/AdminShell";
import AdminDisclosure from "@/components/admin/AdminDisclosure";
import {getDbComplaints, getDbCustomers, getDbGroupBuys, getDbPayments, getDbProducts} from "@/data/dbAdmin";
import {getDbOrders} from "@/data/dbOrders";
import {formatNaira} from "@/lib/format";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function percentage(value: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function metricValue(value: number) {
  return new Intl.NumberFormat("en-NG").format(value);
}

export default async function ReportsPage() {
  const [orders, customers, products, payments, complaints, groupBuys, receipts] =
    await Promise.all([
      getDbOrders(),
      getDbCustomers(),
      getDbProducts(),
      getDbPayments(),
      getDbComplaints(),
      getDbGroupBuys(),
      prisma.receipt.findMany({orderBy: {issuedAt: "desc"}}),
    ]);

  const totalOrderValue = orders.reduce((sum, order) => sum + order.estimatedTotal, 0);
  const totalPaymentsReceived = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalReceiptsIssued = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const outstandingBalance = customers.reduce(
    (sum, customer) => sum + customer.outstandingBalance,
    0,
  );
  const creditLimit = customers.reduce((sum, customer) => sum + customer.creditLimit, 0);

  const paidOrApprovedOrders = orders.filter((order) =>
    ["paid", "approved"].some((word) => order.paymentStatus.toLowerCase().includes(word)),
  );
  const unpaidOrders = orders.filter((order) =>
    order.paymentStatus.toLowerCase().includes("unpaid"),
  );
  const fulfilledOrders = orders.filter((order) =>
    ["fulfilled", "delivered", "collected", "complete"].some((word) =>
      order.fulfilmentStatus.toLowerCase().includes(word),
    ),
  );
  const activeComplaints = complaints.filter(
    (complaint) => !["Closed", "Resolved"].includes(complaint.status),
  );
  const loginReadyBuyers = customers.filter((customer) => customer.accountLoginReady);
  const activeProducts = products.filter((product) => product.status === "Active");
  const unavailableProducts = products.filter(
    (product) => product.availability === "Unavailable" || product.status !== "Active",
  );
  const activeGroupBuys = groupBuys.filter((groupBuy) =>
    ["Open", "Minimum met"].includes(groupBuy.status),
  );

  const topProducts = [...products]
    .sort((a, b) => b.orderItems.length - a.orderItems.length)
    .slice(0, 8);

  const performanceMetrics = [
    ["Total orders", metricValue(orders.length)],
    ["Total order value", formatNaira(totalOrderValue)],
    ["Payments received", formatNaira(totalPaymentsReceived)],
    ["Receipts issued", formatNaira(totalReceiptsIssued)],
    ["Outstanding balance", formatNaira(outstandingBalance)],
    ["Credit limit exposure", formatNaira(creditLimit)],
    ["Customers", metricValue(customers.length)],
    ["Buyer login ready", `${metricValue(loginReadyBuyers.length)} / ${metricValue(customers.length)}`],
    ["Products", metricValue(products.length)],
    ["Active products", metricValue(activeProducts.length)],
    ["Unavailable / paused", metricValue(unavailableProducts.length)],
    ["Active group-buys", metricValue(activeGroupBuys.length)],
  ];

  const kpiRows = [
    {
      label: "Paid / approved order rate",
      value: percentage(paidOrApprovedOrders.length, orders.length),
      detail: `${paidOrApprovedOrders.length} of ${orders.length} orders`,
    },
    {
      label: "Unpaid order rate",
      value: percentage(unpaidOrders.length, orders.length),
      detail: `${unpaidOrders.length} of ${orders.length} orders`,
    },
    {
      label: "Fulfilment completion rate",
      value: percentage(fulfilledOrders.length, orders.length),
      detail: `${fulfilledOrders.length} of ${orders.length} orders marked fulfilled, delivered, collected or complete`,
    },
    {
      label: "Active complaint rate",
      value: percentage(activeComplaints.length, orders.length),
      detail: `${activeComplaints.length} active complaints against ${orders.length} orders`,
    },
    {
      label: "Buyer account readiness",
      value: percentage(loginReadyBuyers.length, customers.length),
      detail: `${loginReadyBuyers.length} buyer accounts marked login-ready`,
    },
  ];

  return (
    <AdminShell
      title="Reports"
      description="Operating metrics for sales, buyers, products, fulfilment and issues."
    >
      <section className="grid gap-5">
        <AdminDisclosure title="Company metrics" defaultOpen>
        <div className="rounded-2xl border border-[#102015]/10 bg-white p-4 text-[#102015] shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            Performance snapshot
          </p>
          <h2 className="mt-3 text-2xl font-black">Company snapshot</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            {performanceMetrics.map(([label, value]) => (
              <div
                key={label}
                className="rounded-3xl border border-[#102015]/10 bg-[#f7f5ec] p-5"
              >
                <p className="text-sm font-semibold text-[#405348]">{label}</p>
                <p className="mt-2 text-2xl font-black text-[#102015]">{value}</p>
              </div>
            ))}
          </div>
        </div>
        </AdminDisclosure>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <AdminDisclosure title="KPI health" defaultOpen={false}>
          <section className="rounded-2xl border border-[#102015]/10 bg-white p-4 text-[#102015] shadow-sm">
            <h2 className="text-2xl font-black">KPI health</h2>

            <div className="mt-6 grid gap-4">
              {kpiRows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-3xl border border-[#102015]/10 bg-[#f7f5ec] p-5"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-black text-[#102015]">{row.label}</p>
                      <p className="mt-1 text-sm leading-6 text-[#405348]">{row.detail}</p>
                    </div>
                    <p className="text-3xl font-black text-[#1f7a3f]">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          </AdminDisclosure>

          <AdminDisclosure title="Investor notes" defaultOpen={false}>
          <section className="rounded-2xl border border-[#102015]/10 bg-white p-4 text-[#102015] shadow-sm">
            <h2 className="text-2xl font-black">Investor notes</h2>

            <div className="mt-6 grid gap-3 text-sm leading-7 text-[#405348]">
              <div className="rounded-2xl bg-[#f7f5ec] p-4">
                <strong className="text-[#102015]">Growth:</strong> summarise order count, buyer growth,
                repeat buyer activity and group-buy traction.
              </div>
              <div className="rounded-2xl bg-[#f7f5ec] p-4">
                <strong className="text-[#102015]">Revenue:</strong> report estimated order value,
                payments received, receipts issued and outstanding balances.
              </div>
              <div className="rounded-2xl bg-[#f7f5ec] p-4">
                <strong className="text-[#102015]">Operations:</strong> show fulfilment completion,
                active issues, product availability and supplier readiness.
              </div>
              <div className="rounded-2xl bg-[#f7f5ec] p-4">
                <strong className="text-[#102015]">Focus:</strong> keep this view clean for management reporting and investor updates.
              </div>
            </div>
          </section>
          </AdminDisclosure>
        </div>

        <AdminDisclosure title="Product performance" defaultOpen={false}>
        <section className="rounded-2xl border border-[#102015]/10 bg-white p-4 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-black">Product performance</h2>

          <div className="mt-6 overflow-x-auto rounded-3xl border border-[#102015]/10">
            <table className="min-w-full divide-y divide-[#102015]/10 text-sm">
              <thead className="bg-[#f3f8ef] text-left text-xs uppercase tracking-[0.18em] text-[#405348]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Product</th>
                  <th className="px-5 py-4 font-semibold">Category</th>
                  <th className="px-5 py-4 font-semibold">Orders</th>
                  <th className="px-5 py-4 font-semibold">Availability</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#102015]/10">
                {topProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-5 py-4 font-black text-[#102015]">{product.name}</td>
                    <td className="px-5 py-4 text-[#405348]">{product.category}</td>
                    <td className="px-5 py-4 text-[#405348]">{product.orderItems.length}</td>
                    <td className="px-5 py-4 text-[#405348]">{product.availability}</td>
                    <td className="px-5 py-4 text-[#405348]">{product.status}</td>
                  </tr>
                ))}

                {topProducts.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-[#405348]" colSpan={5}>
                      No product order activity yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
        </AdminDisclosure>
      </section>
    </AdminShell>
  );
}
