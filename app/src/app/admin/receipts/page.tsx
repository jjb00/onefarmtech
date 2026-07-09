import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {
  AdminCompactMetric,
  AdminStatusPill,
  AdminViewBar,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import {prisma} from "@/lib/prisma";
import {issueReceiptAction} from "@/actions/orderOperations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReceiptsPageProps = {
  searchParams?: Promise<{
    status?: string;
    sort?: string;
  }>;
};

function money(value: number) {
  return `₦${value.toLocaleString()}`;
}

function hrefFor(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/admin/receipts?${query}` : "/admin/receipts";
}

export default async function ReceiptsPage({searchParams}: ReceiptsPageProps) {
  const params = await searchParams;
  const status = params?.status || "all";
  const sort = params?.sort || "newest";

  const [receipts, orders] = await Promise.all([
    prisma.receipt.findMany({
      orderBy: {issuedAt: "desc"},
      include: {order: true, payment: true, customer: true},
      take: 100,
    }),
    prisma.order.findMany({
      orderBy: {createdAt: "desc"},
      include: {
        customer: true,
        payments: {orderBy: {createdAt: "desc"}},
        receipts: true,
      },
      take: 50,
    }),
  ]);

  const receiptTotal = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const availableOrders = orders.filter((order) => !order.receipts.length);

  const filtered = receipts.filter((receipt) => {
    if (status === "all") return true;
    return receipt.status.toLowerCase().includes(status);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "oldest") return a.issuedAt.getTime() - b.issuedAt.getTime();
    if (sort === "amount-high") return b.amount - a.amount;
    if (sort === "amount-low") return a.amount - b.amount;
    return b.issuedAt.getTime() - a.issuedAt.getTime();
  });

  const base = {status, sort};

  return (
    <AdminPageShell
      title="Receipts"
      description="Receipt records for paid or approved orders."
    >
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-3">
          <AdminCompactMetric label="Receipts issued" value={String(receipts.length)} tone="blue" />
          <AdminCompactMetric label="Receipt value" value={money(receiptTotal)} tone="green" />
          <AdminCompactMetric label="Orders available" value={String(availableOrders.length)} tone="amber" />
        </section>

        <AdminViewBar
          title="Receipt controls"
          description={`${sorted.length} receipt${sorted.length === 1 ? "" : "s"} shown.`}
          filterOptions={[
            {label: "All", href: hrefFor({...base, status: "all"}), active: status === "all"},
            {label: "Issued", href: hrefFor({...base, status: "issued"}), active: status === "issued"},
            {label: "Draft", href: hrefFor({...base, status: "draft"}), active: status === "draft"},
          ]}
          sortOptions={[
            {label: "Newest", href: hrefFor({...base, sort: "newest"}), active: sort === "newest"},
            {label: "Oldest", href: hrefFor({...base, sort: "oldest"}), active: sort === "oldest"},
            {label: "Amount high", href: hrefFor({...base, sort: "amount-high"}), active: sort === "amount-high"},
            {label: "Amount low", href: hrefFor({...base, sort: "amount-low"}), active: sort === "amount-low"},
          ]}
        />

        <details className="rounded-2xl border border-[#102015]/10 bg-white p-4 text-[#102015] shadow-sm">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#102015]">Issue receipt</h2>
                <p className="mt-1 text-sm text-[#405348]">
                  Open only when issuing a manual receipt. {availableOrders.length} orders available.
                </p>
              </div>
              <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">
                Open
              </span>
            </div>
          </summary>

          <div className="mt-5 grid max-h-[34rem] gap-3 overflow-y-auto pr-1">
            {availableOrders.map((order) => {
              const latestPayment = order.payments[0];

              return (
                <form
                  key={order.id}
                  action={issueReceiptAction}
                  className="grid gap-3 rounded-2xl border border-[#102015]/10 bg-[#f3f8ef] p-3 lg:grid-cols-[1.2fr_0.7fr_0.9fr_auto]"
                >
                  <input type="hidden" name="orderId" value={order.id} />
                  {latestPayment ? <input type="hidden" name="paymentId" value={latestPayment.id} /> : null}

                  <div>
                    <p className="font-black text-[#102015]">{order.code} · {order.buyerName}</p>
                    <p className="mt-1 text-xs text-[#587063]">
                      {order.paymentStatus} · Order total {money(order.estimatedTotal)}
                    </p>
                  </div>

                  <input
                    name="amount"
                    type="number"
                    min="0"
                    defaultValue={latestPayment?.amount || order.estimatedTotal}
                    className="rounded-xl border border-[#102015]/10 bg-white px-3 py-2 text-sm text-[#102015] outline-none"
                    aria-label="Receipt amount"
                  />

                  <input
                    name="buyerEmail"
                    type="email"
                    defaultValue={order.customer?.receiptEmail || order.customer?.email || ""}
                    className="rounded-xl border border-[#102015]/10 bg-white px-3 py-2 text-sm text-[#102015] outline-none"
                    placeholder="buyer email optional"
                    aria-label="Buyer email"
                  />

                  <button type="submit" className="rounded-full bg-[#1f7a3f] px-4 py-2 text-sm font-black text-white">
                    Issue
                  </button>
                </form>
              );
            })}

            {!availableOrders.length ? (
              <p className="rounded-2xl bg-[#f3f8ef] p-5 text-sm text-[#405348]">
                No orders available for receipts.
              </p>
            ) : null}
          </div>
        </details>

        <section className="overflow-hidden rounded-2xl border border-[#102015]/10 bg-white text-[#102015] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-[#f3f8ef] text-xs uppercase tracking-[0.14em] text-[#405348]">
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
                {sorted.map((receipt) => (
                  <tr key={receipt.id} className="border-t border-[#102015]/10">
                    <td className="px-4 py-3 font-bold">
                      <Link href={`/admin/receipts/${receipt.code}`} className="text-[#1f7a3f] underline-offset-4 hover:underline">
                        {receipt.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#102015]">{receipt.buyerName}</div>
                      <div className="text-xs text-[#587063]">{receipt.buyerEmail || "No email"}</div>
                    </td>
                    <td className="px-4 py-3 text-[#102015]">{receipt.order.code}</td>
                    <td className="px-4 py-3 font-black text-[#102015]">{money(receipt.amount)}</td>
                    <td className="px-4 py-3 text-[#405348]">{receipt.issuedAt.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <AdminStatusPill tone={adminToneFromStatus(receipt.status)}>
                        {receipt.status}
                      </AdminStatusPill>
                    </td>
                  </tr>
                ))}

                {!sorted.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-[#587063]" colSpan={6}>
                      No receipts match this view.
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
