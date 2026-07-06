import Link from "next/link";
import {notFound} from "next/navigation";
import {AdminPage} from "@/components/portal/AdminPage";
import BuyerMessageStatusPill from "@/components/buyer/BuyerMessageStatusPill";
import {
  logOrderBuyerMessageAction,
  updateAdminOrderControlAction,
} from "@/actions/createAdminRecords";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatNaira(amount: number | null | undefined) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClass(status: string | null | undefined) {
  const key = String(status || "").toLowerCase();

  if (
    key.includes("paid") ||
    key.includes("delivered") ||
    key.includes("complete") ||
    key.includes("issued")
  ) {
    return "bg-[#eef6ea] text-[#1f7a3f]";
  }

  if (
    key.includes("failed") ||
    key.includes("cancelled") ||
    key.includes("issue")
  ) {
    return "bg-[#ffe8e5] text-[#9b1c1c]";
  }

  return "bg-[#fff6d6] text-[#7a4a00]";
}

const paymentStatusOptions = [
  "Payment pending",
  "Unpaid",
  "Part-paid",
  "Paid",
  "Payment failed",
  "Payment cancelled",
  "Refunded",
];

const fulfilmentStatusOptions = [
  "New order",
  "WhatsApp order received",
  "Buyer request",
  "Confirmed",
  "Being prepared",
  "Delivery pending assignment",
  "Delivery assigned",
  "Picked up by delivery partner",
  "Out for delivery",
  "Delivered",
  "Delivery issue",
  "Cancelled",
];

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{id: string}>;
}) {
  await requireStaff();

  const {id} = await params;

  const order = await prisma.order.findUnique({
    where: {id},
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          buyerType: true,
          emailNormalized: true,
          phoneNormalized: true,
          accountStatus: true,
          paymentTerms: true,
          creditLimit: true,
          outstandingBalance: true,
        },
      },
      items: {
        orderBy: {createdAt: "asc"},
      },
      paymentRequests: {
        orderBy: {createdAt: "desc"},
      },
      payments: {
        orderBy: {createdAt: "desc"},
      },
      receipts: {
        orderBy: {createdAt: "desc"},
      },
      complaints: {
        orderBy: {createdAt: "desc"},
        take: 5,
      },
      delivery: {
        include: {
          deliveryPartner: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              serviceArea: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const buyerMessages = order.customerId
    ? await prisma.buyerMessage.findMany({
        where: {
          customerId: order.customerId,
          relatedType: "Order",
          relatedId: order.id,
        },
        orderBy: {createdAt: "desc"},
        take: 10,
      })
    : [];

  const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = order.totalAmount || order.estimatedTotal || subtotal;

  return (
    <AdminPage
      title={`Order ${order.code}`}
      subtitle="Order control centre for buyer, items, payment, delivery and communication evidence."
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Order control
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#102015]">
              {order.code}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              Created {formatDate(order.createdAt)} · Source: {order.source || order.orderType}
              {order.sourcePhone ? ` · ${order.sourcePhone}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-4 py-2 text-sm font-black ${statusClass(order.paymentStatus)}`}>
              {order.paymentStatus}
            </span>
            <span className={`rounded-full px-4 py-2 text-sm font-black ${statusClass(order.fulfilmentStatus)}`}>
              {order.fulfilmentStatus}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Link
            href="/admin/orders"
            className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-center text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
          >
            All orders
          </Link>
          <Link
            href="/admin/payment-requests"
            className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-center text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
          >
            Payment requests
          </Link>
          <Link
            href="/admin/deliveries"
            className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-center text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
          >
            Deliveries
          </Link>
          {order.customerId ? (
            <Link
              href={`/admin/customers/${order.customerId}`}
              className="rounded-full bg-[#1f7a3f] px-4 py-2 text-center text-sm font-black text-white hover:bg-[#155c2f]"
            >
              Open buyer
            </Link>
          ) : (
            <Link
              href="/admin/buyer-account-requests"
              className="rounded-full bg-[#1f7a3f] px-4 py-2 text-center text-sm font-black text-white hover:bg-[#155c2f]"
            >
              Link buyer
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            Buyer
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#102015]">
            {order.customer?.fullName || order.buyerName}
          </h3>

          <div className="mt-4 grid gap-3 text-sm text-[#405348] md:grid-cols-2">
            <p><span className="font-black text-[#102015]">Phone:</span> {order.phone}</p>
            <p><span className="font-black text-[#102015]">Buyer type:</span> {order.customer?.buyerType || order.buyerType}</p>
            <p><span className="font-black text-[#102015]">Account:</span> {order.customer?.accountStatus || "Unlinked"}</p>
            <p><span className="font-black text-[#102015]">Terms:</span> {order.customer?.paymentTerms || "Not set"}</p>
            <p><span className="font-black text-[#102015]">Credit limit:</span> {formatNaira(order.customer?.creditLimit)}</p>
            <p><span className="font-black text-[#102015]">Outstanding:</span> {formatNaira(order.customer?.outstandingBalance)}</p>
          </div>

          {!order.customerId ? (
            <div className="mt-5 rounded-2xl bg-[#fff6d6] p-4 text-sm leading-7 text-[#7a4a00]">
              This order is not linked to a buyer account. Link the phone number to a buyer/customer account so future WhatsApp orders update the buyer portal automatically.
            </div>
          ) : null}
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            Totals
          </p>

          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#405348]">Subtotal</dt>
              <dd className="font-black text-[#102015]">{formatNaira(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#405348]">Delivery</dt>
              <dd className="font-black text-[#102015]">{formatNaira(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#405348]">Service fee</dt>
              <dd className="font-black text-[#102015]">{formatNaira(order.serviceFee)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#405348]">Discount</dt>
              <dd className="font-black text-[#102015]">-{formatNaira(order.discountAmount)}</dd>
            </div>
            <div className="border-t border-[#102015]/10 pt-3">
              <div className="flex justify-between gap-4">
                <dt className="text-[#405348]">Total</dt>
                <dd className="text-2xl font-black text-[#102015]">{formatNaira(total)}</dd>
              </div>
            </div>
          </dl>

          <p className="mt-4 rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
            Payment reference:{" "}
            <span className="font-black text-[#102015]">
              {order.paymentReference || order.paymentRequests[0]?.reference || "Not created"}
            </span>
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Items
            </p>
            <h3 className="mt-2 text-2xl font-black text-[#102015]">
              Order basket
            </h3>
          </div>
          <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">
            {order.items.length} lines
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f7f5ec] text-[#405348]">
              <tr>
                <th className="px-5 py-4 font-semibold">Product</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Unit</th>
                <th className="px-5 py-4 font-semibold">Qty</th>
                <th className="px-5 py-4 font-semibold">Unit price</th>
                <th className="px-5 py-4 font-semibold">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#405348]" colSpan={6}>
                    No line items recorded.
                  </td>
                </tr>
              ) : (
                order.items.map((item) => (
                  <tr key={item.id} className="border-b border-[#102015]/10">
                    <td className="px-5 py-4 font-black text-[#102015]">{item.productName}</td>
                    <td className="px-5 py-4 text-[#405348]">{item.category}</td>
                    <td className="px-5 py-4 text-[#405348]">{item.unit}</td>
                    <td className="px-5 py-4 text-[#405348]">{item.quantity}</td>
                    <td className="px-5 py-4 text-[#405348]">{formatNaira(item.unitPrice)}</td>
                    <td className="px-5 py-4 font-black text-[#102015]">{formatNaira(item.lineTotal)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
          Status controls
        </p>
        <h3 className="mt-2 text-2xl font-black text-[#102015]">
          Update order status
        </h3>

        <form action={updateAdminOrderControlAction} className="mt-6 grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="orderId" value={order.id} />

          <label className="grid gap-2 text-sm font-bold text-[#405348]">
            Payment status
            <select
              name="paymentStatus"
              defaultValue={order.paymentStatus}
              className="rounded-2xl border border-[#102015]/15 bg-white px-4 py-3 text-[#102015]"
            >
              {paymentStatusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold text-[#405348]">
            Fulfilment status
            <select
              name="fulfilmentStatus"
              defaultValue={order.fulfilmentStatus}
              className="rounded-2xl border border-[#102015]/15 bg-white px-4 py-3 text-[#102015]"
            >
              {fulfilmentStatusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold text-[#405348]">
            Delivery note
            <textarea
              name="deliveryNote"
              defaultValue={order.deliveryNote || ""}
              rows={3}
              className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[#405348]">
            Admin note
            <textarea
              name="adminNote"
              defaultValue={order.adminNote || ""}
              rows={3}
              className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
            />
          </label>

          <div className="lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
            >
              Save order status
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Payment
              </p>
              <h3 className="mt-2 text-2xl font-black text-[#102015]">
                Payment requests
              </h3>
            </div>
            <Link
              href="/admin/payment-requests"
              className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
            >
              Manage payments
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {order.paymentRequests.length === 0 ? (
              <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
                No payment requests created.
              </p>
            ) : (
              order.paymentRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-[#102015]/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[#102015]">{request.reference}</p>
                      <p className="text-sm text-[#405348]">
                        {request.provider} · {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#102015]">{formatNaira(request.amount)}</p>
                      <BuyerMessageStatusPill status={request.status} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Delivery
              </p>
              <h3 className="mt-2 text-2xl font-black text-[#102015]">
                Delivery record
              </h3>
            </div>
            <Link
              href="/admin/deliveries"
              className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
            >
              Manage delivery
            </Link>
          </div>

          {order.delivery ? (
            <div className="mt-5 grid gap-3 rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
              <p><span className="font-black text-[#102015]">Status:</span> {order.delivery.status}</p>
              <p><span className="font-black text-[#102015]">Partner:</span> {order.delivery.deliveryPartner?.name || order.delivery.deliveryPartnerName || "Unassigned"}</p>
              <p><span className="font-black text-[#102015]">Partner phone:</span> {order.delivery.deliveryPartner?.phone || order.delivery.deliveryPartnerPhone || "Not set"}</p>
              <p><span className="font-black text-[#102015]">Fee:</span> {formatNaira(order.delivery.deliveryFee)}</p>
              <p><span className="font-black text-[#102015]">Area:</span> {order.delivery.deliveryArea || "Not set"}</p>
              <p><span className="font-black text-[#102015]">Address:</span> {order.delivery.deliveryAddress || "Not set"}</p>
              <p><span className="font-black text-[#102015]">Tracking:</span> {order.delivery.trackingReference || "Not set"}</p>
              <p><span className="font-black text-[#102015]">Proof / issue:</span> {order.delivery.proofOfDeliveryNote || "Not set"}</p>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
              No delivery record created for this order yet.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            Payments and receipts
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#102015]">
            Confirmed records
          </h3>

          <div className="mt-5 grid gap-4">
            <div className="rounded-2xl bg-[#f7f5ec] p-4">
              <h4 className="font-black text-[#102015]">Payments</h4>
              <div className="mt-3 grid gap-2">
                {order.payments.length === 0 ? (
                  <p className="text-sm text-[#405348]">No confirmed payments.</p>
                ) : (
                  order.payments.map((payment) => (
                    <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-[#102015]">{payment.reference}</span>
                      <span>{formatNaira(payment.amount)}</span>
                      <BuyerMessageStatusPill status={payment.status} />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-[#f7f5ec] p-4">
              <h4 className="font-black text-[#102015]">Receipts</h4>
              <div className="mt-3 grid gap-2">
                {order.receipts.length === 0 ? (
                  <p className="text-sm text-[#405348]">No receipts issued.</p>
                ) : (
                  order.receipts.map((receipt) => (
                    <div key={receipt.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-[#102015]">{receipt.code}</span>
                      <span>{formatNaira(receipt.amount)}</span>
                      <BuyerMessageStatusPill status={receipt.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            Buyer message
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#102015]">
            Log an order update
          </h3>

          {order.customerId ? (
            <form action={logOrderBuyerMessageAction} className="mt-5 grid gap-4">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="customerId" value={order.customerId} />

              <label className="grid gap-2 text-sm font-bold text-[#405348]">
                Channel
                <select
                  name="channel"
                  defaultValue="Portal"
                  className="rounded-2xl border border-[#102015]/15 bg-white px-4 py-3 text-[#102015]"
                >
                  <option>Portal</option>
                  <option>WhatsApp</option>
                  <option>Email</option>
                  <option>Phone</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#405348]">
                Title
                <input
                  name="title"
                  required
                  defaultValue={`Update on ${order.code}`}
                  className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#405348]">
                Message
                <textarea
                  name="body"
                  required
                  rows={4}
                  className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                  placeholder="Write the buyer-visible order update..."
                />
              </label>

              <button
                type="submit"
                className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
              >
                Log buyer message
              </button>
            </form>
          ) : (
            <p className="mt-5 rounded-2xl bg-[#fff6d6] p-4 text-sm leading-7 text-[#7a4a00]">
              Link this order to a buyer account before logging buyer inbox messages.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Evidence
            </p>
            <h3 className="mt-2 text-2xl font-black text-[#102015]">
              Buyer message log for this order
            </h3>
          </div>

          <Link
            href="/admin/buyer-messages"
            className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
          >
            All messages
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          {buyerMessages.length === 0 ? (
            <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348]">
              No buyer messages logged for this order yet.
            </p>
          ) : (
            buyerMessages.map((message) => (
              <article key={message.id} className="rounded-2xl border border-[#102015]/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <BuyerMessageStatusPill status={message.status} />
                      <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black text-[#405348]">
                        {message.channel}
                      </span>
                    </div>
                    <h4 className="mt-3 font-black text-[#102015]">{message.title}</h4>
                  </div>
                  <p className="text-sm text-[#405348]">{formatDate(message.createdAt)}</p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#405348]">
                  {message.body}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </AdminPage>
  );
}
