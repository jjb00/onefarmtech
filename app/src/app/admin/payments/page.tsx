/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Prisma payment attempt grouping is runtime validated.
import Link from "next/link";
import {redirect} from "next/navigation";
import {
  generatePaymentLinkAction,
  issueReceiptFromPaymentRequestAction,
  sendPaymentRequestWhatsAppAction,
  updatePaymentRequestStatusAction,
} from "@/actions/createAdminRecords";
import {verifyFlutterwavePaymentAction} from "@/actions/verifyFlutterwavePayment";
import {verifyPaystackPaymentAction} from "@/actions/verifyPaystackPayment";
import {
  AdminEmptyState,
  AdminListToolbar,
  AdminPagination,
  AdminResultCount,
} from "@/components/admin/AdminListControls";
import {
  AdminCompactMetric,
  AdminStatusPill,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import AdminRecordControls from "@/components/admin/AdminRecordControls";
import AdminShell from "@/components/admin/AdminShell";
import {requireStaff} from "@/lib/auth";
import {adminListHref, adminResultRange, parseAdminPage, parseAdminPageSize} from "@/lib/adminListParams.js";
import {buildPaymentInstructionMessage} from "@/lib/communications/paymentTemplates";
import {
  filterPaymentGroups,
  groupPaymentRequestsByOrder,
  paymentWorkspaceStatus,
} from "@/lib/paymentWorkspace.js";
import {isReusablePaymentRequest} from "@/lib/payments/paymentInitialization.js";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PATH = "/admin/payments";
const VIEWS = ["needs-action", "pending", "paid", "cancelled", "all"];

type Params = Record<string, string | string[] | undefined>;

function value(input: string | string[] | undefined) {
  return String(Array.isArray(input) ? input[0] : input || "").trim();
}

function formatNaira(amount: number | null | undefined) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(input: Date | string | null | undefined) {
  if (!input) return "Not set";

  return new Intl.DateTimeFormat("en-GB", {timeZone: "Africa/Lagos", 
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(input));
}

function feedbackMessage(params: Params | undefined) {
  if (value(params?.verified)) {
    return `Payment ${value(params?.verified)} was verified and recorded.`;
  }

  if (value(params?.whatsapp) === "accepted") {
    return "The payment message was accepted for sending.";
  }

  if (value(params?.updated)) {
    return "Payment status updated.";
  }

  if (value(params?.deleted)) {
    return "Payment request deleted.";
  }

  return "";
}

function errorMessage(params: Params | undefined) {
  const detail = value(params?.detail);
  const error = value(params?.error);

  if (detail) return detail;
  if (!error) return "";

  if (error.includes("not-found")) return "The payment record was not found.";
  if (error.includes("verification")) return "Payment verification could not be completed.";
  if (error === "not-paid") return "A receipt can only be issued after payment is confirmed.";
  if (error === "PAYMENT_REQUEST_DELETE_BLOCKED") return "Paid payment requests can't be deleted -- they're the record behind a receipt.";

  return "The payment action could not be completed.";
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}) {
  const staff = await requireStaff();

  const params = await searchParams;
  const requestedView = value(params?.view) || "needs-action";
  const view = VIEWS.includes(requestedView) ? requestedView : "needs-action";
  const provider = value(params?.provider) || "all";
  const q = value(params?.q);
  const page = parseAdminPage(value(params?.page));
  const pageSize = parseAdminPageSize(value(params?.pageSize));

  const requests = await prisma.paymentRequest.findMany({
    orderBy: [{createdAt: "desc"}, {id: "desc"}],
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

  const requestIds = requests.map((request) => request.id);

  const whatsappMessages = requestIds.length
    ? await prisma.buyerMessage.findMany({
        where: {
          relatedType: "PaymentRequest",
          relatedId: {in: requestIds},
          channel: "WhatsApp",
          direction: "Outbound",
          source: "WhatsApp API",
        },
        select: {
          relatedId: true,
          status: true,
          metadata: true,
          createdAt: true,
          sentAt: true,
        },
        orderBy: {createdAt: "desc"},
      })
    : [];

  const whatsappByRequest = new Map();

  for (const message of whatsappMessages) {
    if (message.relatedId && !whatsappByRequest.has(message.relatedId)) {
      whatsappByRequest.set(message.relatedId, message);
    }
  }

  const groups = groupPaymentRequestsByOrder(requests);

  const receipts = groups.length
    ? await prisma.receipt.findMany({
        where: {orderId: {in: groups.map((group) => group.orderId)}},
        orderBy: {issuedAt: "desc"},
        select: {orderId: true, code: true},
      })
    : [];

  const receiptByOrder = new Map<string, {code: string}>();

  for (const receipt of receipts) {
    if (!receiptByOrder.has(receipt.orderId)) {
      receiptByOrder.set(receipt.orderId, receipt);
    }
  }

  const counts = {
    needsAction: groups.filter(
      (group) => paymentWorkspaceStatus(group) === "needs-action",
    ).length,
    pending: groups.filter(
      (group) => paymentWorkspaceStatus(group) === "pending",
    ).length,
    paid: groups.filter(
      (group) => paymentWorkspaceStatus(group) === "paid",
    ).length,
    paidValue: groups
      .filter((group) => paymentWorkspaceStatus(group) === "paid")
      .reduce((sum, group) => sum + group.amount, 0),
  };

  const filtered = filterPaymentGroups(groups, {view, provider, query: q}).sort(
    (a, b) =>
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const base = {view, provider, q, pageSize};

  if (page > totalPages) {
    redirect(adminListHref(PATH, base, {page: totalPages}));
  }

  const visible = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const range = adminResultRange(page, pageSize, total);
  const feedback = feedbackMessage(params);
  const error = errorMessage(params);

  const viewLabels = [
    ["all", "All payments"],
    ["cancelled", "Cancelled"],
  ];

  return (
    <AdminShell
      title="Payments"
      description="Follow up current payment obligations and review attempt history."
      compactHeader
    >
      <div className="grid gap-5">
        {feedback ? (
          <div className="rounded-2xl border border-[#1f7a3f]/20 bg-[#eef6ea] p-4 text-sm font-bold text-[#1f7a3f]">
            {feedback}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-[#9b1c1c]/20 bg-[#ffe8e5] p-4 text-sm font-bold text-[#9b1c1c]"
          >
            {error}
          </div>
        ) : null}

        <section className="grid gap-3 md:grid-cols-4">
          <AdminCompactMetric
            label="Needs action"
            value={String(counts.needsAction)}
            tone="red"
            href={`${PATH}?view=needs-action`}
          />
          <AdminCompactMetric
            label="Pending"
            value={String(counts.pending)}
            tone="amber"
            href={`${PATH}?view=pending`}
          />
          <AdminCompactMetric
            label="Paid"
            value={String(counts.paid)}
            tone="green"
            href={`${PATH}?view=paid`}
          />
          <AdminCompactMetric
            label="Received"
            value={formatNaira(counts.paidValue)}
            tone="green"
          />
        </section>

        <nav
          aria-label="Payment views"
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {viewLabels.map(([key, label]) => (
            <Link
              key={key}
              href={adminListHref(PATH, {view: key, provider, q, pageSize})}
              aria-current={view === key ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-black ${
                view === key
                  ? "bg-[#102015] text-white"
                  : "border bg-white text-[#102015]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <AdminListToolbar
          search={q}
          pageSize={pageSize}
          resetHref={`${PATH}?view=${view}`}
          hiddenParams={{view, provider}}
          searchLabel="Search payments"
          searchPlaceholder="Order, buyer, phone or payment reference"
          filters={[
            {
              name: "provider",
              label: "Provider",
              value: provider,
              options: [
                {value: "all", label: "All providers"},
                {value: "manual", label: "Manual"},
                {value: "bank transfer", label: "Bank transfer"},
                {value: "paystack", label: "Paystack"},
                {value: "flutterwave", label: "Flutterwave"},
              ],
            },
          ]}
        />

        <AdminResultCount {...range} total={total} label="payment obligations" />

        {visible.length ? (
          <div className="grid gap-4">
            {visible.map((group) => {
              const request = group.current;
              const receipt = receiptByOrder.get(group.orderId);
              const reusableLink = isReusablePaymentRequest(request);
              const whatsappMessage = whatsappByRequest.get(request.id);

              let whatsappError = "";

              try {
                const metadata = JSON.parse(whatsappMessage?.metadata || "{}");
                whatsappError =
                  metadata.error ||
                  metadata.providerErrors?.[0]?.details ||
                  metadata.providerErrors?.[0]?.message ||
                  "";
              } catch {}

              const buyerName =
                group.customer?.name || group.order.buyerName;

              const paymentMessage = buildPaymentInstructionMessage({
                orderCode: group.order.code,
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

              return (
                <article
                  key={group.orderId}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/admin/orders/${group.orderId}`}
                        className="text-lg font-black text-[#1f7a3f]"
                      >
                        {group.order.code}
                      </Link>
                      <p className="font-bold text-[#102015]">{buyerName}</p>
                      <p className="text-sm text-[#587063]">
                        {group.order.phone}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-black text-[#102015]">
                        {formatNaira(group.amount)}
                      </p>
                      <AdminStatusPill
                        tone={adminToneFromStatus(group.status)}
                      >
                        {group.status}
                      </AdminStatusPill>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-2xl bg-[#f7f5ec] p-4 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-xs font-black uppercase text-[#587063]">
                        Current request
                      </p>
                      <p className="mt-1 font-bold text-[#102015]">
                        {request.reference}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase text-[#587063]">
                        Provider
                      </p>
                      <p className="mt-1 font-bold text-[#102015]">
                        {request.provider}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase text-[#587063]">
                        Payment
                      </p>
                      <p className="mt-1 font-bold text-[#102015]">
                        {group.order.paymentStatus}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase text-[#587063]">
                        Last activity
                      </p>
                      <p className="mt-1 font-bold text-[#102015]">
                        {formatDate(group.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {request.status === "Failed" && request.providerError ? (
                    <p className="mt-3 rounded-xl bg-[#ffe8e5] p-3 text-sm font-bold text-[#9b1c1c]">
                      {request.provider} payment attempt failed: {request.providerError}
                    </p>
                  ) : null}

                  {whatsappMessage?.status === "Failed" ? (
                    <p className="mt-3 rounded-xl bg-[#ffe8e5] p-3 text-sm font-bold text-[#9b1c1c]">
                      WhatsApp delivery failed
                      {whatsappError ? `: ${whatsappError}` : "."}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {request.status !== "Paid" &&
                    request.provider === "Paystack" ? (
                      <form action={verifyPaystackPaymentAction}>
                        <input type="hidden" name="id" value={request.id} />
                        <button className="min-h-11 rounded-full bg-[#1f7a3f] px-4 text-sm font-black text-white">
                          Verify payment
                        </button>
                      </form>
                    ) : null}

                    {request.status !== "Paid" &&
                    request.provider === "Flutterwave" ? (
                      <form action={verifyFlutterwavePaymentAction}>
                        <input type="hidden" name="id" value={request.id} />
                        <button className="min-h-11 rounded-full bg-[#1f7a3f] px-4 text-sm font-black text-white">
                          Verify payment
                        </button>
                      </form>
                    ) : null}

                    {request.status !== "Paid" && !reusableLink ? (
                      <form action={generatePaymentLinkAction}>
                        <input type="hidden" name="id" value={request.id} />
                        <input type="hidden" name="provider" value="Paystack" />
                        <button className="min-h-11 rounded-full bg-[#102015] px-4 text-sm font-black text-white">
                          Create payment link
                        </button>
                      </form>
                    ) : null}

                    {reusableLink ? (
                      <a
                        href={request.paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center rounded-full border bg-white px-4 text-sm font-black text-[#102015]"
                      >
                        Open payment link
                      </a>
                    ) : null}

                    {request.status !== "Paid" &&
                    (!whatsappMessage ||
                      whatsappMessage.status === "Failed") ? (
                      <form action={sendPaymentRequestWhatsAppAction}>
                        <input type="hidden" name="id" value={request.id} />
                        <button
                          disabled={!group.order.phone}
                          className="min-h-11 rounded-full border bg-white px-4 text-sm font-black text-[#1f7a3f] disabled:opacity-40"
                        >
                          {whatsappMessage?.status === "Failed"
                            ? "Retry same link"
                            : "Send payment request"}
                        </button>
                      </form>
                    ) : null}

                    {request.status === "Paid" && receipt ? (
                      <Link
                        href={`/admin/receipts/${receipt.code}`}
                        className="inline-flex min-h-11 items-center rounded-full border bg-white px-4 text-sm font-black text-[#102015]"
                      >
                        View receipt
                      </Link>
                    ) : null}

                    {request.status === "Paid" && !receipt ? (
                      <form action={issueReceiptFromPaymentRequestAction}>
                        <input type="hidden" name="id" value={request.id} />
                        <button className="min-h-11 rounded-full border bg-white px-4 text-sm font-black text-[#9b1c1c]">
                          Retry receipt
                        </button>
                      </form>
                    ) : null}
                  </div>

                  <details className="mt-4 rounded-xl border bg-white p-4">
                    <summary className="cursor-pointer text-sm font-black text-[#587063]">
                      {request.status === "Paid"
                        ? "Manual correction"
                        : "Manual payment backup"}
                    </summary>

                    <div className="mt-4 grid gap-4">
                      <form
                        action={updatePaymentRequestStatusAction}
                        className="grid gap-3 md:grid-cols-2"
                      >
                        <input type="hidden" name="id" value={request.id} />

                        <label className="grid gap-1 text-sm font-bold">
                          Status
                          <select
                            name="status"
                            defaultValue={request.status}
                            className="rounded-xl border bg-white px-3 py-2"
                          >
                            <option>Pending</option>
                            <option>Paid</option>
                            <option>Failed</option>
                            <option>Cancelled</option>
                          </select>
                        </label>

                        <label className="grid gap-1 text-sm font-bold">
                          Provider
                          <select
                            name="provider"
                            defaultValue={request.provider}
                            className="rounded-xl border bg-white px-3 py-2"
                          >
                            <option>Manual</option>
                            <option>Bank transfer</option>
                            <option>Paystack</option>
                            <option>Flutterwave</option>
                          </select>
                        </label>

                        <input
                          name="gatewayReference"
                          defaultValue={request.gatewayReference || ""}
                          placeholder="Gateway reference"
                          className="rounded-xl border px-3 py-2"
                        />

                        <input
                          name="paymentUrl"
                          defaultValue={request.paymentUrl || ""}
                          placeholder="Payment URL"
                          className="rounded-xl border px-3 py-2"
                        />

                        <input
                          name="bankName"
                          defaultValue={request.bankName || ""}
                          placeholder="Bank name"
                          className="rounded-xl border px-3 py-2"
                        />

                        <input
                          name="accountNumber"
                          defaultValue={request.accountNumber || ""}
                          placeholder="Account number"
                          className="rounded-xl border px-3 py-2"
                        />

                        <input
                          name="accountName"
                          defaultValue={request.accountName || ""}
                          placeholder="Account name"
                          className="rounded-xl border px-3 py-2"
                        />

                        <button className="rounded-full bg-[#1f7a3f] px-4 py-2 text-sm font-black text-white">
                          Save payment
                        </button>
                      </form>

                      <details className="rounded-xl bg-[#f7f5ec] p-3">
                        <summary className="cursor-pointer text-sm font-black">
                          Payment message
                        </summary>
                        <textarea
                          readOnly
                          rows={8}
                          value={paymentMessage}
                          className="mt-3 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                        />
                      </details>
                    </div>
                  </details>

                  <details className="mt-3 rounded-xl border bg-white p-4">
                    <summary className="cursor-pointer font-black text-[#102015]">
                      Payment history ({group.attempts.length})
                    </summary>

                    <div className="mt-4 grid gap-3">
                      {group.attempts.map((attempt) => (
                        <div
                          key={attempt.id}
                          className="grid gap-2 rounded-xl bg-[#f7f5ec] p-3 text-sm md:grid-cols-[1fr_auto_auto_auto]"
                        >
                          <div>
                            <p className="font-black text-[#102015]">
                              {attempt.reference}
                            </p>
                            <p className="text-xs text-[#587063]">
                              {formatDate(attempt.createdAt)}
                            </p>
                          </div>

                          <p>{attempt.provider}</p>
                          <p className="font-black">
                            {formatNaira(attempt.amount)}
                          </p>

                          <AdminStatusPill
                            tone={adminToneFromStatus(attempt.status)}
                          >
                            {attempt.status}
                          </AdminStatusPill>

                          {attempt.providerError ? (
                            <p className="text-xs font-bold text-[#9b1c1c] md:col-span-4">
                              {attempt.provider}: {attempt.providerError}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </details>

                  {request.status !== "Paid" ? (
                    <AdminRecordControls
                      recordType="PaymentRequest"
                      recordId={request.id}
                      canDelete={staff.role === "Super admin"}
                      returnTo={PATH}
                    />
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <AdminEmptyState
            title="No payment obligations match this view"
            description="Try another view, provider or search."
            resetHref={PATH}
          />
        )}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          previousHref={
            page > 1
              ? adminListHref(PATH, base, {page: page - 1})
              : undefined
          }
          nextHref={
            page < totalPages
              ? adminListHref(PATH, base, {page: page + 1})
              : undefined
          }
        />
      </div>
    </AdminShell>
  );
}
