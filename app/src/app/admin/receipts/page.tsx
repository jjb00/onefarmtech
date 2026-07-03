import Link from "next/link";
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
    <main className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C95F3D]">
          Finance
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#101712]">Receipts</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#1E2420]/70">
          Manual electronic receipt records for paid or approved orders. This prepares
          the platform for buyer accounts, receipt history, and later automated PDF/email receipts.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Receipts issued" value={String(receipts.length)} />
        <Metric label="Receipt value" value={money(receiptTotal)} />
        <Metric
          label="Orders available"
          value={String(orders.filter((order) => !order.receipts.length).length)}
        />
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-[#101712]">Issue receipt</h2>
        <p className="mt-2 text-sm text-[#1E2420]/60">
          Choose an order and issue a manual receipt record. For now, this does not email or generate a PDF.
        </p>

        <div className="mt-6 grid gap-4">
          {orders.map((order) => {
            const latestPayment = order.payments[0];

            return (
              <form
                key={order.id}
                action={issueReceiptAction}
                className="grid gap-4 rounded-2xl border border-[#101712]/10 bg-[#F8F1E7] p-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
              >
                <input type="hidden" name="orderId" value={order.id} />
                {latestPayment ? (
                  <input type="hidden" name="paymentId" value={latestPayment.id} />
                ) : null}

                <div>
                  <p className="font-black text-[#101712]">
                    {order.code} · {order.buyerName}
                  </p>
                  <p className="mt-1 text-xs text-[#1E2420]/60">
                    {order.paymentStatus} · Order total {money(order.estimatedTotal)} ·{" "}
                    {order.receipts.length} receipt(s)
                  </p>
                </div>

                <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-[#1E2420]/55">
                  Amount
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    defaultValue={latestPayment?.amount || order.estimatedTotal}
                    className="rounded-xl border border-[#101712]/10 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none"
                  />
                </label>

                <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-[#1E2420]/55">
                  Buyer email
                  <input
                    name="buyerEmail"
                    type="email"
                    defaultValue={
                      order.customer?.receiptEmail || order.customer?.email || ""
                    }
                    className="rounded-xl border border-[#101712]/10 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none"
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
            <p className="rounded-2xl bg-[#F8F1E7] p-5 text-sm text-[#1E2420]/60">
              No orders available for receipts.
            </p>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.5rem] border border-[#101712]/10 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#101712] text-white">
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
              <tr key={receipt.id} className="border-t border-[#101712]/10">
                <td className="px-4 py-3 font-bold">
                  <Link
                    href={`/admin/receipts/${receipt.code}`}
                    className="text-[#1f7a3f] underline-offset-4 hover:underline"
                  >
                    {receipt.code}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{receipt.buyerName}</div>
                  <div className="text-xs text-[#1E2420]/55">
                    {receipt.buyerEmail || "No email"}
                  </div>
                </td>
                <td className="px-4 py-3">{receipt.order.code}</td>
                <td className="px-4 py-3">{money(receipt.amount)}</td>
                <td className="px-4 py-3 text-[#1E2420]/60">
                  {receipt.issuedAt.toLocaleString()}
                </td>
                <td className="px-4 py-3">{receipt.status}</td>
              </tr>
            ))}

            {!receipts.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#1E2420]/60" colSpan={6}>
                  No receipts issued yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-[1.5rem] bg-[#101712] p-5 text-white shadow-sm">
      <p className="text-2xl font-black text-[#F2B84B]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-white/70">{label}</p>
    </div>
  );
}
