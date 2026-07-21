/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- commerce actions are server-validated at runtime
import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {
  AdminCompactMetric,
  AdminStatusPill,
  AdminViewBar,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import {
  generatePaymentLinkAction,
  issueReceiptFromPaymentRequestAction,
  sendPaymentRequestWhatsAppAction,
  updatePaymentRequestStatusAction,
} from "@/actions/createAdminRecords";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {buildPaymentInstructionMessage} from "@/lib/communications/paymentTemplates";
import {isReusablePaymentRequest} from "@/lib/payments/paymentInitialization.js";
import {verifyPaystackPaymentAction} from "@/actions/verifyPaystackPayment";
import {verifyFlutterwavePaymentAction} from "@/actions/verifyFlutterwavePayment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    provider?: string;
    date?: string;
    sort?: string;
    error?: string;
    detail?: string;
    whatsapp?: string;
    verified?: string;
  }>;
};

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

function hrefFor(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/admin/payment-requests?${query}` : "/admin/payment-requests";
}

function inDateRange(value: Date, range: string) {
  if (range === "all") return true;

  const now = new Date();
  const date = new Date(value);

  if (range === "today") {
    return date.toDateString() === now.toDateString();
  }

  if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo;
  }

  if (range === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  if (range === "year") {
    return date.getFullYear() === now.getFullYear();
  }

  return true;
}

export default async function AdminPaymentRequestsPage({searchParams}: PageProps) {
  await requireStaff();

  const params = await searchParams;
  const status = params?.status || "all";
  const provider = params?.provider || "all";
  const date = params?.date || "all";
  const sort = params?.sort || "newest";

  const paymentRequests = await prisma.paymentRequest.findMany({
    orderBy: {createdAt: "desc"},
    take: 200,
    include: {
      order: {
        select: {
          id: true,
          code: true,
          buyerName: true,
          phone: true,
          paymentStatus: true,
          fulfilmentStatus: true,
          deliveryMethod: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  const paymentRequestIds = paymentRequests.map((request) => request.id);

  const whatsappMessages = paymentRequestIds.length
    ? await prisma.buyerMessage.findMany({
        where: {
          relatedType: "PaymentRequest",
          relatedId: {in: paymentRequestIds},
          channel: "WhatsApp",
          direction: "Outbound",
          source: "WhatsApp API",
        },
        select: {
          relatedId: true,
          sentAt: true,
          createdAt: true,
          metadata: true,
          status: true,
          recipient: true,
        },
        orderBy: {createdAt: "desc"},
      })
    : [];

  const whatsappByRequest = new Map(
    whatsappMessages
      .filter((message) => message.relatedId)
      .filter((message, index, messages) => messages.findIndex((candidate) => candidate.relatedId === message.relatedId) === index)
      .map((message) => [message.relatedId, message]),
  );

  const pending = paymentRequests.filter((request) => request.status === "Pending");
  const paid = paymentRequests.filter((request) => request.status === "Paid");
  const failed = paymentRequests.filter((request) => ["Failed", "Cancelled"].includes(request.status));
  const totalPendingValue = pending.reduce((sum, request) => sum + request.amount, 0);

  const filtered = paymentRequests.filter((request) => {
    const statusMatch = status === "all" || request.status.toLowerCase() === status;
    const providerMatch = provider === "all" || request.provider.toLowerCase() === provider;
    const dateMatch = inDateRange(request.createdAt, date);
    return statusMatch && providerMatch && dateMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
    if (sort === "amount-high") return b.amount - a.amount;
    if (sort === "amount-low") return a.amount - b.amount;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const base = {status, provider, date, sort};

  return (
    <AdminPage
      title="Payment requests"
      subtitle="Payment links, buyer follow-up, status updates and receipt actions."
    >
      {params?.error ? <div role="alert" className="mb-4 rounded-2xl border border-[#C95F3D]/25 bg-[#fff4ef] px-4 py-3 text-sm font-bold text-[#9b2f12]">{params.detail || params.error}</div> : null}
      {params?.whatsapp === "accepted" ? <div className="mb-4 rounded-2xl border border-[#1f7a3f]/20 bg-[#eef6ea] px-4 py-3 text-sm font-bold text-[#1f7a3f]">Payment link created separately. WhatsApp accepted the notification for sending; delivery status will update from Meta.</div> : null}
      {params?.verified ? <div className="mb-4 rounded-2xl border border-[#1f7a3f]/20 bg-[#eef6ea] px-4 py-3 text-sm font-bold text-[#1f7a3f]">The provider verified payment {params.verified}. The payment request, order and receipt records are now reconciled.</div> : null}
      <section className="grid gap-3 md:grid-cols-4">
        <AdminCompactMetric label="Pending" value={String(pending.length)} tone="amber" href={hrefFor({...base, status: "pending"})} />
        <AdminCompactMetric label="Pending value" value={formatNaira(totalPendingValue)} tone="amber" />
        <AdminCompactMetric label="Paid" value={String(paid.length)} tone="green" href={hrefFor({...base, status: "paid"})} />
        <AdminCompactMetric label="Failed / cancelled" value={String(failed.length)} tone="red" href={hrefFor({...base, status: "failed"})} />
      </section>

      <AdminViewBar
        title="Payment request controls"
        description={`${sorted.length} request${sorted.length === 1 ? "" : "s"} shown.`}
        filterOptions={[
          {label: "All", href: hrefFor({...base, status: "all"}), active: status === "all"},
          {label: "Pending", href: hrefFor({...base, status: "pending"}), active: status === "pending"},
          {label: "Paid", href: hrefFor({...base, status: "paid"}), active: status === "paid"},
          {label: "Failed", href: hrefFor({...base, status: "failed"}), active: status === "failed"},
          {label: "Cancelled", href: hrefFor({...base, status: "cancelled"}), active: status === "cancelled"},
        ]}
        dateOptions={[
          {label: "All time", href: hrefFor({...base, date: "all"}), active: date === "all"},
          {label: "Today", href: hrefFor({...base, date: "today"}), active: date === "today"},
          {label: "7 days", href: hrefFor({...base, date: "week"}), active: date === "week"},
          {label: "This month", href: hrefFor({...base, date: "month"}), active: date === "month"},
          {label: "This year", href: hrefFor({...base, date: "year"}), active: date === "year"},
        ]}
        sortOptions={[
          {label: "Newest", href: hrefFor({...base, sort: "newest"}), active: sort === "newest"},
          {label: "Oldest", href: hrefFor({...base, sort: "oldest"}), active: sort === "oldest"},
          {label: "Amount high", href: hrefFor({...base, sort: "amount-high"}), active: sort === "amount-high"},
          {label: "Amount low", href: hrefFor({...base, sort: "amount-low"}), active: sort === "amount-low"},
        ]}
      >
        <div className="flex flex-wrap gap-2">
          {["all", "manual", "bank transfer", "paystack", "flutterwave"].map((option) => (
            <Link
              key={option}
              href={hrefFor({...base, provider: option})}
              className={`rounded-full px-3 py-1.5 text-xs font-black ${
                provider === option
                  ? "bg-[#102015] text-white"
                  : "border border-[#102015]/10 bg-[#f7f5ec] text-[#102015] hover:bg-[#eef6ea]"
              }`}
            >
              {option === "all" ? "All providers" : option}
            </Link>
          ))}
        </div>
      </AdminViewBar>

      <section className="overflow-hidden rounded-2xl border border-[#102015]/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
            <thead className="bg-[#f3f8ef] text-xs uppercase tracking-[0.14em] text-[#405348]">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Buyer / order</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sorted.map((request) => {
                const buyerName = request.customer?.name || request.order.buyerName;
                const reusableLink = isReusablePaymentRequest(request);
                const paymentMessage = buildPaymentInstructionMessage({
                  orderCode: request.order.code,
                  buyerName,
                  amount: request.amount,
                  currency: request.currency,
                  reference: request.reference,
                  provider: request.provider,
                  paymentUrl: request.paymentUrl,
                  bankName: request.bankName,
                  accountNumber: request.accountNumber,
                  accountName: request.accountName,
                });

                const whatsappMessage = whatsappByRequest.get(request.id);
                let whatsappMetadata: {error?: string; providerErrors?: Array<{details?: string; message?: string}>} = {};
                try { whatsappMetadata = JSON.parse(whatsappMessage?.metadata || "{}"); } catch {}
                const whatsappError = whatsappMetadata.error || whatsappMetadata.providerErrors?.[0]?.details || whatsappMetadata.providerErrors?.[0]?.message || null;

                return (
                  <tr key={request.id} className="border-t border-[#102015]/10 align-top text-[#405348]">
                    <td className="px-4 py-3 font-black text-[#102015]">{request.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#102015]">{buyerName}</p>
                      <Link href={`/admin/orders/${request.orderId}`} className="text-xs font-black text-[#1f7a3f] underline-offset-4 hover:underline">
                        {request.order.code}
                      </Link>
                      <p className="text-xs">{request.order.phone}</p>
                      <p className="mt-1 text-xs font-bold">{request.order.deliveryMethod} · Payment: {request.order.paymentStatus} · Fulfilment: {request.order.fulfilmentStatus}</p>
                    </td>
                    <td className="px-4 py-3 font-black text-[#102015]">{formatNaira(request.amount)}</td>
                    <td className="px-4 py-3">
                      <AdminStatusPill tone={adminToneFromStatus(request.status)}>
                        {request.status}
                      </AdminStatusPill>
                    </td>
                    <td className="px-4 py-3">{request.provider}</td>
                    <td className="px-4 py-3">
                      {reusableLink ? (
                        <a href={request.paymentUrl} target="_blank" rel="noreferrer" className="font-black text-[#1f7a3f] underline-offset-4 hover:underline">
                          Open link
                        </a>
                      ) : request.status === "Failed" && request.providerError ? (
                        <span className="text-xs font-bold text-[#9b2f12]">{request.provider}: {request.providerError}</span>
                      ) : (
                        <span className="text-xs font-bold text-[#587063]">{request.paymentUrl ? "Expired or unavailable" : "No link"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {whatsappMessage ? (
                        <div className="grid gap-1"><AdminStatusPill tone={adminToneFromStatus(whatsappMessage.status)}>{whatsappMessage.status}</AdminStatusPill>{whatsappError ? <span className="max-w-xs text-xs font-bold text-[#9b2f12]">{whatsappError}</span> : null}</div>
                      ) : (
                        <AdminStatusPill tone="amber">Not sent</AdminStatusPill>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatDate(request.createdAt)}</td>
                    <td className="px-4 py-3">
                      <details className="rounded-xl border border-[#102015]/10 bg-[#fbfff8] p-3">
                        <summary className="cursor-pointer text-xs font-black text-[#1f7a3f]">
                          Manage
                        </summary>

                        <div className="mt-3 grid min-w-[26rem] gap-4">
                          <form action={updatePaymentRequestStatusAction} className="grid gap-3">
                            <input type="hidden" name="id" value={request.id} />

                            <div className="grid gap-3 sm:grid-cols-2">
                              <select name="status" defaultValue={request.status} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-[#102015]">
                                <option>Pending</option>
                                <option>Paid</option>
                                <option>Failed</option>
                                <option>Cancelled</option>
                              </select>

                              <select name="provider" defaultValue={request.provider} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-[#102015]">
                                <option>Manual</option>
                                <option>Bank transfer</option>
                                <option>Paystack</option>
                                <option>Flutterwave</option>
                              </select>
                            </div>

                            <input name="gatewayReference" defaultValue={request.gatewayReference || ""} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-[#102015]" placeholder="Gateway reference" />
                            <input name="paymentUrl" defaultValue={request.paymentUrl || ""} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-[#102015]" placeholder="Payment URL" />

                            <div className="grid gap-3 sm:grid-cols-2">
                              <input name="bankName" defaultValue={request.bankName || ""} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-[#102015]" placeholder="Bank name" />
                              <input name="accountNumber" defaultValue={request.accountNumber || ""} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-[#102015]" placeholder="Account number" />
                            </div>

                            <input name="accountName" defaultValue={request.accountName || ""} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-[#102015]" placeholder="Account name" />

                            <button type="submit" className="rounded-full bg-[#1f7a3f] px-4 py-2 text-xs font-black text-white">
                              Save status
                            </button>
                          </form>

                          <details className="rounded-xl border border-[#102015]/10 bg-white p-3">
                            <summary className="cursor-pointer text-xs font-black text-[#102015]">Payment message</summary>
                            <textarea
                              readOnly
                              rows={8}
                              value={paymentMessage}
                              className="mt-3 w-full rounded-xl border border-[#102015]/15 bg-[#f7f5ec] px-3 py-2 text-sm leading-6 text-[#102015]"
                            />
                          </details>

                          <div className="flex flex-wrap gap-2 border-t border-[#102015]/10 pt-3">
                            {request.status !== "Paid" ? (
                              <>
                                {request.provider === "Paystack" ? (
                                  <form action={verifyPaystackPaymentAction}>
                                    <input type="hidden" name="id" value={request.id} />
                                    <button type="submit" className="rounded-full border border-[#1f7a3f]/25 bg-[#eef6ea] px-4 py-2 text-xs font-black text-[#1f7a3f]">
                                      Verify with Paystack
                                    </button>
                                  </form>
                                ) : null}
                                {request.provider === "Flutterwave" ? (
                                  <form action={verifyFlutterwavePaymentAction}>
                                    <input type="hidden" name="id" value={request.id} />
                                    <button type="submit" className="rounded-full border border-[#1f7a3f]/25 bg-[#eef6ea] px-4 py-2 text-xs font-black text-[#1f7a3f]">
                                      Verify with Flutterwave
                                    </button>
                                  </form>
                                ) : null}
                                <form action={generatePaymentLinkAction}>
                                  <input type="hidden" name="id" value={request.id} />
                                  <input type="hidden" name="provider" value="Paystack" />
                                  <button type="submit" disabled={request.status === "Paid"} className="rounded-full bg-[#1f7a3f] px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                                    {reusableLink ? "Use Paystack link" : "Create Paystack link"}
                                  </button>
                                </form>

                                <form action={generatePaymentLinkAction}>
                                  <input type="hidden" name="id" value={request.id} />
                                  <input type="hidden" name="provider" value="Flutterwave" />
                                  <button type="submit" disabled={request.status === "Paid"} className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-xs font-black text-[#102015] disabled:cursor-not-allowed disabled:opacity-40">
                                    Flutterwave link
                                  </button>
                                </form>
                              </>
                            ) : null}

                            {!whatsappMessage || whatsappMessage.status === "Failed" ? (
                              <form action={sendPaymentRequestWhatsAppAction}>
                                <input type="hidden" name="id" value={request.id} />
                                <button type="submit" disabled={!request.order.phone} className="rounded-full border border-[#1f7a3f]/25 bg-[#eef6ea] px-4 py-2 text-xs font-black text-[#1f7a3f] disabled:cursor-not-allowed disabled:opacity-40">
                                  {whatsappMessage?.status === "Failed" ? "Retry same link" : "Send message"}
                                </button>
                              </form>
                            ) : null}

                            <form action={issueReceiptFromPaymentRequestAction}>
                              <input type="hidden" name="id" value={request.id} />
                              <button type="submit" disabled={request.status !== "Paid"} className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-xs font-black text-[#102015] disabled:cursor-not-allowed disabled:opacity-40">
                                Issue receipt
                              </button>
                            </form>

                            {request.customerId ? (
                              <Link href={`/admin/customers/${request.customerId}`} className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-xs font-black text-[#102015]">
                                Open buyer
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}

              {!sorted.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#587063]" colSpan={9}>
                    No payment requests match this view.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminPage>
  );
}
