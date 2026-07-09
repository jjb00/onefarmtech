import AdminPageShell from "@/components/AdminPageShell";
import {
  AdminCompactMetric,
  AdminStatusPill,
  AdminViewBar,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import { getDbPayments } from "@/data/dbAdmin";

type PaymentsPageProps = {
  searchParams?: Promise<{
    status?: string;
    sort?: string;
  }>;
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | null) {
  if (!date) return "Not paid yet";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function hrefFor(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/admin/payments?${query}` : "/admin/payments";
}

export default async function PaymentsPage({searchParams}: PaymentsPageProps) {
  const params = await searchParams;
  const status = params?.status || "all";
  const sort = params?.sort || "newest";
  const payments = await getDbPayments();

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paystack = payments.filter((payment) => payment.provider === "Paystack");
  const manual = payments.filter((payment) => payment.provider !== "Paystack");

  const filtered = payments.filter((payment) => {
    const key = payment.status.toLowerCase();
    if (status === "all") return true;
    if (status === "paid") return key.includes("paid");
    if (status === "pending") return key.includes("pending");
    if (status === "paystack") return payment.provider === "Paystack";
    if (status === "manual") return payment.provider !== "Paystack";
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "amount-high") return b.amount - a.amount;
    if (sort === "amount-low") return a.amount - b.amount;
    if (sort === "oldest") return (a.paidAt || a.createdAt).getTime() - (b.paidAt || b.createdAt).getTime();
    return (b.paidAt || b.createdAt).getTime() - (a.paidAt || a.createdAt).getTime();
  });

  const base = {status, sort};

  return (
    <AdminPageShell
      title="Payments"
      description="Confirmed and recorded payment transactions with compact filters and sorting."
    >
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-4">
          <AdminCompactMetric label="Payments" value={String(payments.length)} tone="blue" />
          <AdminCompactMetric label="Received" value={formatNaira(totalPaid)} tone="green" />
          <AdminCompactMetric label="Paystack" value={String(paystack.length)} tone="green" href={hrefFor({...base, status: "paystack"})} />
          <AdminCompactMetric label="Manual / other" value={String(manual.length)} tone="amber" href={hrefFor({...base, status: "manual"})} />
        </section>

        <AdminViewBar
          title="Payment controls"
          description={`${sorted.length} payment${sorted.length === 1 ? "" : "s"} shown.`}
          filterOptions={[
            {label: "All", href: hrefFor({...base, status: "all"}), active: status === "all"},
            {label: "Paid", href: hrefFor({...base, status: "paid"}), active: status === "paid"},
            {label: "Pending", href: hrefFor({...base, status: "pending"}), active: status === "pending"},
            {label: "Paystack", href: hrefFor({...base, status: "paystack"}), active: status === "paystack"},
            {label: "Manual", href: hrefFor({...base, status: "manual"}), active: status === "manual"},
          ]}
          sortOptions={[
            {label: "Newest", href: hrefFor({...base, sort: "newest"}), active: sort === "newest"},
            {label: "Oldest", href: hrefFor({...base, sort: "oldest"}), active: sort === "oldest"},
            {label: "Amount high", href: hrefFor({...base, sort: "amount-high"}), active: sort === "amount-high"},
            {label: "Amount low", href: hrefFor({...base, sort: "amount-low"}), active: sort === "amount-low"},
          ]}
        />

        <section className="overflow-hidden rounded-2xl border border-[#102015]/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#102015]/10 text-sm">
              <thead className="bg-[#f3f8ef] text-left text-xs uppercase tracking-[0.14em] text-[#405348]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Buyer</th>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Paid date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#102015]/10">
                {sorted.map((payment) => (
                  <tr key={payment.id} className="text-[#405348]">
                    <td className="px-4 py-3 font-semibold text-[#102015]">{payment.reference}</td>
                    <td className="px-4 py-3">{payment.order.code}</td>
                    <td className="px-4 py-3">{payment.order.customer?.name || payment.order.buyerName}</td>
                    <td className="px-4 py-3">{payment.provider}</td>
                    <td className="px-4 py-3 font-black text-[#102015]">{formatNaira(payment.amount)}</td>
                    <td className="px-4 py-3">{formatDate(payment.paidAt)}</td>
                    <td className="px-4 py-3">
                      <AdminStatusPill tone={adminToneFromStatus(payment.status)}>
                        {payment.status}
                      </AdminStatusPill>
                    </td>
                  </tr>
                ))}

                {!sorted.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-[#587063]" colSpan={7}>
                      No payments match this view.
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
