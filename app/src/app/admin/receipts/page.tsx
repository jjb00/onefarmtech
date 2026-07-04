import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {prisma} from "@/lib/prisma";
import {issueReceiptAction} from "@/actions/orderOperations";

function money(value: number) {
  return `₦${value.toLocaleString()}`;
}

export default async function ReceiptsPage() {
  const [receipts, orders] = await Promise.all([
    prisma.receipt.findMany({
      orderBy: {issuedAt: "desc"},
      include: {
        order: true,
        payment: true,
        customer: true,
      },
      take: 100,
    }),
    prisma.order.findMany({
      orderBy: {createdAt: "desc"},
      include: {
        customer: true,
        payments: {
          orderBy: {createdAt: "desc"},
        },
        receipts: true,
      },
      take: 50,
    }),
  ]);

  const receiptTotal = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  return (
    <AdminPageShell
      title="Receipts"
      description="Manual electronic receipt records for paid or approved orders. This prepares the platform for buyer accounts, receipt history, and later automated PDF/email receipts."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Receipts issued" value={String(receipts.length)} />
          <Metric label="Receipt value" value={money(receiptTotal)} />
          <Metric
            label="Orders available"
            value={String(orders.filter((order) => !order.receipts.length).length)}
          />
        </section>

        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-black text-[#102015]">Issue receipt</h2>

          <p className="mt-2 text-sm text-[#405348]">
            Choose an order and issue a manual receipt record. For now, this does
            not email or generate a PDF.
          </p>

          <div className="mt-6 grid gap-4">
            {orders.map((order) => {
              const latestPayment = order.payments[0];

              return (
                <form
                  key={order.id}
                  action={issueReceiptAction}
                  className="grid gap-4 rounded-2xl border border-[#102015]/10 bg-[#f3f8ef] p-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
                >
                  <input type="hidden" name="orderId" value={order.id} />

                  {latestPayment ? (
                    <input type="hidden" name="paymentId" value={latestPayment.id} />
                  ) : null}

                  <div>
                    <p className="font-black text-[#102015]">
                      {order.code} · {order.buyerName}
                    </p>

                    <p className="mt-1 text-xs text-[#587063]">
                      {order.paymentStatus} · Order total{" "}
                      {money(order.estimatedTotal)} · {order.receipts.length}{" "}
                      receipt(s)
                    </p>
                  </div>

                  <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-[#587063]">
                    Amount
                    <input
                      name="amount"
                      type="number"
                      min="0"
                      defaultValue={latestPayment?.amount || order.estimatedTotal}
                      className="rounded-xl border border-[#102015]/10 bg-white px-3 py-2 text-sm font-normal text-[#102015] normal-case tracking-normal outline-none"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-[#587063]">
                    Buyer email
                    <input
                      name="buyerEmail"
                      type="email"
                      defaultValue={
                        order.customer?.receiptEmail || order.customer?.email || ""
                      }
                      className="rounded-xl border border-[#102015]/10 bg-white px-3 py-2 text-sm font-normal text-[#102015] normal-case tracking-normal outline-none"
                      placeholder="optional"
                    />
                  </label>

                  <button
                    type="submit"
                    className="self-end rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white"
                  >
                    Issue
                  </button>
                </form>
              );
            })}

            {!orders.length ? (
              <p className="rounded-2xl bg-[#f3f8ef] p-5 text-sm text-[#405348]">
                No orders available for receipts.
              </p>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-[#102015]/10 bg-white text-[#102015] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-[#f3f8ef] text-[#405348]">
                <tr>
                  <th className="px-4 py-3">Receipt</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="border-t border-[#102015]/10">
                    <td className="px-4 py-3 font-bold">
                      <Link
                        href={`/admin/receipts/${receipt.code}`}
                        className="text-[#1f7a3f] underline-offset-4 hover:underline"
                      >
                        {receipt.code}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#102015]">
                        {receipt.buyerName}
                      </div>
                      <div className="text-xs text-[#587063]">
                        {receipt.buyerEmail || "No email"}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-[#102015]">
                      {receipt.order.code}
                    </td>

                    <td className="px-4 py-3 text-[#102015]">
                      {money(receipt.amount)}
                    </td>

                    <td className="px-4 py-3 text-[#405348]">
                      {receipt.issuedAt.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-[#102015]">
                      {receipt.status}
                    </td>
                  </tr>
                ))}

                {!receipts.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-[#587063]" colSpan={6}>
                      No receipts issued yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-[2rem] border border-[#102015]/10 bg-white p-5 text-[#102015] shadow-sm">
      <p className="text-2xl font-black text-[#1f7a3f]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#405348]">{label}</p>
    </div>
  );
}
