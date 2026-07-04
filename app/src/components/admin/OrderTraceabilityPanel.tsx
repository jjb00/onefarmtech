import Link from "next/link";
import {formatNaira} from "@/lib/format";

type TraceabilityOrder = {
  id: string;
  code: string;
  buyerName: string;
  customerId?: string | null;
  estimatedTotal: number;
  payments: {
    id: string;
    reference: string;
    amount: number;
    status: string;
  }[];
  receipts?: {
    id: string;
    code: string;
    amount: number;
    status: string;
  }[];
  complaints: {
    id: string;
    code: string;
    status: string;
  }[];
};

export default function OrderTraceabilityPanel({order}: {order: TraceabilityOrder}) {
  const paymentTotal = order.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const receiptTotal = (order.receipts || []).reduce((sum, receipt) => sum + receipt.amount, 0);

  return (
    <section className="rounded-[2rem] bg-white p-6 text-[#102015]">
      <h2 className="text-2xl font-bold">Order traceability</h2>
      <p className="mt-2 text-sm leading-6 text-[#587063]">
        Quick links for buyer account, receipts, finance records, issues, and audit review.
      </p>

      <div className="mt-5 grid gap-3">
        {order.customerId ? (
          <Link
            href={`/admin/customers/${order.customerId}`}
            className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#1f7a3f]"
          >
            View linked buyer account
          </Link>
        ) : (
          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#587063]">
            No linked buyer account
          </div>
        )}

        <Link
          href="/admin/receipts"
          className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#1f7a3f]"
        >
          Issue or view receipt
        </Link>

        <Link
          href="/admin/audit-log"
          className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#1f7a3f]"
        >
          Review audit log
        </Link>

        <Link
          href="/admin/operating-manual"
          className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#1f7a3f]"
        >
          Operating manual
        </Link>
      </div>

      <div className="mt-6 grid gap-3">
        <MiniMetric label="Order total" value={formatNaira(order.estimatedTotal)} />
        <MiniMetric label="Payments recorded" value={formatNaira(paymentTotal)} />
        <MiniMetric label="Receipts issued" value={formatNaira(receiptTotal)} />
        <MiniMetric label="Complaints" value={String(order.complaints.length)} />
      </div>
    </section>
  );
}

function MiniMetric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#587063]">{label}</p>
      <p className="mt-2 text-lg font-black text-[#1f7a3f]">{value}</p>
    </div>
  );
}
