import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import StatusBadge from "@/components/admin/StatusBadge";
import OrderTraceabilityPanel from "@/components/admin/OrderTraceabilityPanel";
import {
  formatOrderTotal,
  getDbOrderByCode,
  getDbOrderCodes,
} from "@/data/dbOrders";
import { formatNaira } from "@/lib/format";
import { updateOrderAction } from "@/actions/updateOrder";
import {
  createComplaintAction,
  createPaymentAction,
} from "@/actions/orderOperations";
import { fulfilmentStatuses, paymentStatuses } from "@/constants/orderOptions";

type OrderDetailPageProps = {
  params: Promise<{
    code: string;
  }>;
};

type OrderItemRow = {
  id: string;
  name: string;
  grade: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
};

type PaymentRow = {
  id: string;
  reference: string;
  provider: string;
  amount: number;
  status: string;
};

type ComplaintRow = {
  id: string;
  code: string;
  issue: string;
  priority: string;
  status: string;
  resolution: string | null;
};

export async function generateStaticParams() {
  return getDbOrderCodes();
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { code } = await params;
  const order = await getDbOrderByCode(code);

  if (!order) {
    notFound();
  }

  return (
    <AdminShell
      title={order.code}
      description="Database-backed order detail view for admin review, payment tracking, supply coordination, delivery, and issue handling."
      action={
        <Link
          href="/admin/orders"
          className="rounded-full bg-[#9ee6ad] px-6 py-4 text-center font-semibold text-[#102015]"
        >
          Back to orders
        </Link>
      }
    >
      <section className="mt-10 grid gap-8 xl:grid-cols-[1fr_0.8fr]">
        <div className="grid gap-8">
          <div className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
            <h2 className="text-2xl font-bold">Order summary</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[#f7f5ec] p-5">
                <p className="text-sm text-[#405348]">Buyer</p>
                {order.customerId ? (
                  <Link
                    href={`/admin/customers/${order.customerId}`}
                    className="mt-1 block text-xl font-bold text-[#1f7a3f] underline-offset-4 hover:underline"
                  >
                    {order.buyerName}
                  </Link>
                ) : (
                  <p className="mt-1 text-xl font-bold">{order.buyerName}</p>
                )}
                <p className="mt-1 text-sm text-[#405348]">{order.buyerType}</p>
              </div>

              <div className="rounded-2xl bg-[#f7f5ec] p-5">
                <p className="text-sm text-[#405348]">Contact</p>
                <p className="mt-1 text-xl font-bold">{order.phone}</p>
              </div>

              <div className="rounded-2xl bg-[#f7f5ec] p-5">
                <p className="text-sm text-[#405348]">Total</p>
                <p className="mt-1 text-xl font-bold">
                  {formatOrderTotal(order.estimatedTotal)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f5ec] p-5">
                <p className="text-sm text-[#405348]">Order type</p>
                <p className="mt-1 text-xl font-bold">{order.orderType}</p>
              </div>

              <div className="rounded-2xl bg-[#f7f5ec] p-5">
                <p className="text-sm text-[#405348]">Payment</p>
                <div className="mt-2">
                  <StatusBadge status={order.paymentStatus} />
                </div>
              </div>

              <div className="rounded-2xl bg-[#f7f5ec] p-5">
                <p className="text-sm text-[#405348]">Fulfilment</p>
                <p className="mt-1 text-xl font-bold">
                  {order.fulfilmentStatus}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f5ec] p-5">
                <p className="text-sm text-[#405348]">Delivery method</p>
                <p className="mt-1 text-xl font-bold">{order.deliveryMethod}</p>
              </div>

              <div className="rounded-2xl bg-[#f7f5ec] p-5">
                <p className="text-sm text-[#405348]">Delivery note</p>
                <p className="mt-1 text-sm font-semibold">
                  {order.deliveryNote || "No delivery note"}
                </p>
              </div>
            </div>

            {order.adminNote && (
              <div className="mt-6 rounded-2xl bg-[#fff1d6] p-5">
                <p className="text-sm font-bold text-[#8a5a00]">Admin note</p>
                <p className="mt-2 text-sm leading-6 text-[#405348]">
                  {order.adminNote}
                </p>
              </div>
            )}
          </div>

          <form
            action={updateOrderAction}
            className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm"
          >
            <input type="hidden" name="code" value={order.code} />

            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Admin update</h2>
                <p className="mt-2 text-sm text-[#405348]">
                  Update payment, fulfilment, delivery notes, and internal admin notes.
                </p>
              </div>

              <button
                type="submit"
                className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
              >
                Save order update
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Payment status
                <select
                  name="paymentStatus"
                  defaultValue={order.paymentStatus}
                  className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                >
                  {paymentStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Fulfilment status
                <select
                  name="fulfilmentStatus"
                  defaultValue={order.fulfilmentStatus}
                  className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                >
                  {fulfilmentStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Delivery note
                <textarea
                  name="deliveryNote"
                  defaultValue={order.deliveryNote || ""}
                  className="min-h-24 rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Update delivery address, pickup point, route, or special instructions."
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                Internal admin note
                <textarea
                  name="adminNote"
                  defaultValue={order.adminNote || ""}
                  className="min-h-24 rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                  placeholder="Add supply coordination notes, payment follow-up, supplier assignment, or quality check comments."
                />
              </label>
            </div>
          </form>

          <div className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
            <h2 className="text-2xl font-bold">Order items</h2>

            <div className="mt-6 grid gap-4">
              {order.items.map((item: OrderItemRow) => (
                <article key={item.id} className="rounded-2xl bg-[#f7f5ec] p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{item.name}</h3>
                      <p className="mt-1 text-sm text-[#405348]">
                        {item.grade} · {item.quantity} {item.unit}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="font-semibold">
                        {formatNaira(item.unitPrice)} / {item.unit}
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {formatNaira(item.lineTotal)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="grid gap-8">
          <OrderTraceabilityPanel order={order} />
          <section className="rounded-[2rem] bg-white/10 p-6 text-white">
            <h2 className="text-2xl font-bold">Record payment</h2>

            <form action={createPaymentAction} className="mt-6 grid gap-4">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="orderCode" value={order.code} />

              <label className="grid gap-2 text-sm font-semibold">
                Amount
                <input
                  name="amount"
                  required
                  type="number"
                  min="1"
                  defaultValue={order.estimatedTotal || ""}
                  className="rounded-xl border border-white/10 bg-white px-4 py-3 font-normal text-[#102015] outline-none"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Provider
                <select
                  name="provider"
                  defaultValue="Manual transfer"
                  className="rounded-xl border border-white/10 bg-white px-4 py-3 font-normal text-[#102015] outline-none"
                >
                  <option>Manual transfer</option>
                  <option>Cash</option>
                  <option>Paystack</option>
                  <option>Flutterwave</option>
                  <option>Credit terms</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Reference
                <input
                  name="reference"
                  className="rounded-xl border border-white/10 bg-white px-4 py-3 font-normal text-[#102015] outline-none"
                  placeholder="Optional, auto-generated if blank"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Status
                <select
                  name="status"
                  defaultValue="Fully paid"
                  className="rounded-xl border border-white/10 bg-white px-4 py-3 font-normal text-[#102015] outline-none"
                >
                  {paymentStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="rounded-full bg-[#9ee6ad] px-5 py-3 text-sm font-bold text-[#102015]"
              >
                Save payment
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] bg-white/10 p-6 text-white">
            <h2 className="text-2xl font-bold">Payments</h2>

            <div className="mt-6 grid gap-4">
              {order.payments.length === 0 ? (
                <p className="rounded-2xl bg-white/10 p-4 text-sm text-[#d8e8dc]">
                  No payment records yet.
                </p>
              ) : (
                order.payments.map((payment: PaymentRow) => (
                  <article key={payment.id} className="rounded-2xl bg-white/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{payment.reference}</p>
                        <p className="mt-1 text-sm text-[#d8e8dc]">
                          {payment.provider}
                        </p>
                      </div>

                      <StatusBadge status={payment.status} />
                    </div>

                    <p className="mt-3 text-xl font-bold">
                      {formatNaira(payment.amount)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white/10 p-6 text-white">
            <h2 className="text-2xl font-bold">Log complaint</h2>

            <form action={createComplaintAction} className="mt-6 grid gap-4">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="orderCode" value={order.code} />

              <label className="grid gap-2 text-sm font-semibold">
                Issue
                <textarea
                  name="issue"
                  required
                  className="min-h-24 rounded-xl border border-white/10 bg-white px-4 py-3 font-normal text-[#102015] outline-none"
                  placeholder="e.g. Buyer reported damaged tomatoes"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Priority
                <select
                  name="priority"
                  defaultValue="Medium"
                  className="rounded-xl border border-white/10 bg-white px-4 py-3 font-normal text-[#102015] outline-none"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Status
                <select
                  name="status"
                  defaultValue="Open"
                  className="rounded-xl border border-white/10 bg-white px-4 py-3 font-normal text-[#102015] outline-none"
                >
                  <option>Open</option>
                  <option>Investigating</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Resolution
                <textarea
                  name="resolution"
                  className="min-h-20 rounded-xl border border-white/10 bg-white px-4 py-3 font-normal text-[#102015] outline-none"
                  placeholder="Optional resolution note"
                />
              </label>

              <button
                type="submit"
                className="rounded-full bg-[#9ee6ad] px-5 py-3 text-sm font-bold text-[#102015]"
              >
                Save complaint
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] bg-white/10 p-6 text-white">
            <h2 className="text-2xl font-bold">Complaints</h2>

            <div className="mt-6 grid gap-4">
              {order.complaints.length === 0 ? (
                <p className="rounded-2xl bg-white/10 p-4 text-sm text-[#d8e8dc]">
                  No complaints recorded.
                </p>
              ) : (
                order.complaints.map((complaint: ComplaintRow) => (
                  <article
                    key={complaint.id}
                    className="rounded-2xl bg-white/10 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{complaint.code}</p>
                        <p className="mt-1 text-sm text-[#d8e8dc]">
                          {complaint.issue}
                        </p>
                        <p className="mt-1 text-xs text-[#9ee6ad]">
                          Priority: {complaint.priority}
                        </p>
                      </div>

                      <StatusBadge status={complaint.status} />
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[#d8e8dc]">
                      Resolution: {complaint.resolution || "Pending"}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white/10 p-6 text-white">
            <h2 className="text-2xl font-bold">Admin checklist</h2>
            <div className="mt-6 grid gap-4">
              {[
                "Confirm payment reference",
                "Confirm produce grade and quantity",
                "Assign supplier or fulfilment route",
                "Record quality check before dispatch",
                "Confirm delivery method and fee",
                "Send buyer update on WhatsApp",
                "Mark order completed or issue reported",
              ].map((step, index) => (
                <div key={step} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-[#9ee6ad]">Step {index + 1}</p>
                  <p className="mt-1 font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </AdminShell>
  );
}
