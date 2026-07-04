import AdminPageShell from "@/components/AdminPageShell";
import { getDbPayments } from "@/data/dbAdmin";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Not paid yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function PaymentsPage() {
  const payments = await getDbPayments();

  return (
    <AdminPageShell
      title="Payments"
      description="Track payment references, providers, order links, and buyer payment status."
    >
      <div className="overflow-hidden rounded-3xl border border-[#102015]/10 bg-white">
        <table className="min-w-full divide-y divide-[#102015]/10 text-sm">
          <thead className="bg-[#f3f8ef] text-left text-xs uppercase tracking-[0.18em] text-[#405348]">
            <tr>
              <th className="px-5 py-4 font-semibold">Reference</th>
              <th className="px-5 py-4 font-semibold">Order</th>
              <th className="px-5 py-4 font-semibold">Buyer</th>
              <th className="px-5 py-4 font-semibold">Provider</th>
              <th className="px-5 py-4 font-semibold">Amount</th>
              <th className="px-5 py-4 font-semibold">Paid date</th>
              <th className="px-5 py-4 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#102015]/10">
            {payments.map((payment) => (
              <tr key={payment.id} className="text-[#405348]">
                <td className="px-5 py-4 font-semibold text-[#102015]">{payment.reference}</td>
                <td className="px-5 py-4">{payment.order.code}</td>
                <td className="px-5 py-4">{payment.order.customer?.name || payment.order.buyerName}</td>
                <td className="px-5 py-4">{payment.provider}</td>
                <td className="px-5 py-4">{formatNaira(payment.amount)}</td>
                <td className="px-5 py-4">{formatDate(payment.paidAt)}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full border border-[#102015]/10 bg-white px-3 py-1 text-xs font-semibold text-[#405348]">
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPageShell>
  );
}
