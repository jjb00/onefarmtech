import Link from "next/link";
import BuyerPortalFrame from "@/components/BuyerPortalFrame";
import BuyerMessageStatusPill from "@/components/buyer/BuyerMessageStatusPill";
import {getCurrentBuyer} from "@/lib/currentBuyer";
import {prisma} from "@/lib/prisma";
import {redirect} from "next/navigation";

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

  if (key === "paid" || key === "issued") return "bg-[#eef6ea] text-[#1f7a3f]";
  if (key === "failed" || key === "cancelled") return "bg-[#ffe8e5] text-[#9b1c1c]";
  return "bg-[#fff6d6] text-[#7a4a00]";
}

export default async function BuyerPaymentsPage() {
  const buyer = await getCurrentBuyer();

  if (!buyer?.customerId) {
    redirect("/buyer-account-request");
  }

  const [customer, paymentRequests, payments, receipts, unreadMessageCount] = await Promise.all([
    prisma.customer.findUnique({
      where: {id: buyer.customerId},
      select: {
        id: true,
        fullName: true,
        buyerType: true,
        outstandingBalance: true,
        creditLimit: true,
        paymentTerms: true,
      },
    }),
    prisma.paymentRequest.findMany({
      where: {customerId: buyer.customerId},
      orderBy: {createdAt: "desc"},
      take: 50,
      include: {
        order: {
          select: {
            id: true,
            code: true,
            paymentStatus: true,
            fulfilmentStatus: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        order: {
          customerId: buyer.customerId,
        },
      },
      orderBy: {createdAt: "desc"},
      take: 50,
      include: {
        order: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    }),
    prisma.receipt.findMany({
      where: {customerId: buyer.customerId},
      orderBy: {createdAt: "desc"},
      take: 50,
      include: {
        order: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    }),
    prisma.buyerMessage.count({
      where: {
        customerId: buyer.customerId,
        OR: [{readAt: null}, {status: {in: ["Unread", "Prepared", "Sent"]}}],
      },
    }),
  ]);

  if (!customer) {
    redirect("/buyer-account-request");
  }

  const pendingAmount = paymentRequests
    .filter((request) => request.status !== "Paid")
    .reduce((sum, request) => sum + request.amount, 0);

  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const receiptAmount = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  return (
    <BuyerPortalFrame
      customerName={customer.fullName}
      buyerType={customer.buyerType || "Buyer account"}
      unreadMessageCount={unreadMessageCount}
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Payments
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#102015]">
              Payment requests and receipts
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              View payment references, transfer details, confirmed payments and receipts for your account.
            </p>
          </div>

          <Link
            href="/buyer-account/orders"
            className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
          >
            View orders
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a7d55]">
            Pending requests
          </p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{formatNaira(pendingAmount)}</p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a7d55]">
            Confirmed paid
          </p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{formatNaira(paidAmount)}</p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a7d55]">
            Receipts issued
          </p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{formatNaira(receiptAmount)}</p>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Payment requests
            </p>
            <h3 className="mt-2 text-2xl font-black text-[#102015]">
              Pending and recent requests
            </h3>
          </div>

          <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">
            {paymentRequests.length} requests
          </span>
        </div>

        <div className="mt-6 grid gap-4">
          {paymentRequests.length === 0 ? (
            <div className="rounded-2xl bg-[#f7f5ec] p-5 text-sm leading-7 text-[#405348]">
              No payment requests yet.
            </div>
          ) : (
            paymentRequests.map((request) => (
              <article key={request.id} className="rounded-[1.5rem] border border-[#102015]/10 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(request.status)}`}>
                        {request.status}
                      </span>
                      <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black text-[#405348]">
                        {request.provider}
                      </span>
                    </div>

                    <h4 className="mt-3 text-xl font-black text-[#102015]">
                      {request.reference}
                    </h4>

                    <p className="mt-1 text-sm leading-7 text-[#405348]">
                      Order{" "}
                      <Link
                        href={`/buyer-account/orders/${request.orderId}`}
                        className="font-black text-[#1f7a3f] underline underline-offset-4"
                      >
                        {request.order.code}
                      </Link>{" "}
                      · Created {formatDate(request.createdAt)}
                    </p>
                  </div>

                  <p className="text-2xl font-black text-[#102015]">
                    {formatNaira(request.amount)}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 rounded-2xl bg-[#f7f5ec] p-4 text-sm text-[#405348] md:grid-cols-2">
                  <p>
                    <span className="font-black text-[#102015]">Reference:</span>{" "}
                    {request.reference}
                  </p>
                  <p>
                    <span className="font-black text-[#102015]">Status:</span>{" "}
                    {request.status}
                  </p>
                  <p>
                    <span className="font-black text-[#102015]">Bank:</span>{" "}
                    {request.bankName || "Awaiting payment details"}
                  </p>
                  <p>
                    <span className="font-black text-[#102015]">Account:</span>{" "}
                    {request.accountNumber || "Awaiting payment details"}{" "}
                    {request.accountName ? `· ${request.accountName}` : ""}
                  </p>
                </div>

                {request.paymentUrl ? (
                  <a
                    href={request.paymentUrl}
                    className="mt-4 inline-flex rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
                  >
                    Open payment link
                  </a>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Confirmed payments
              </p>
              <h3 className="mt-2 text-2xl font-black text-[#102015]">
                Payment history
              </h3>
            </div>
            <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">
              {payments.length}
            </span>
          </div>

          <div className="mt-6 grid gap-3">
            {payments.length === 0 ? (
              <p className="rounded-2xl bg-[#f7f5ec] p-5 text-sm text-[#405348]">
                No confirmed payments yet.
              </p>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-[#102015]/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[#102015]">{payment.reference}</p>
                      <p className="text-sm text-[#405348]">
                        Order{" "}
                        <Link
                          href={`/buyer-account/orders/${payment.orderId}`}
                          className="font-black text-[#1f7a3f] underline underline-offset-4"
                        >
                          {payment.order.code}
                        </Link>{" "}
                        · {formatDate(payment.paidAt || payment.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#102015]">{formatNaira(payment.amount)}</p>
                      <BuyerMessageStatusPill status={payment.status} />
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
                Receipts
              </p>
              <h3 className="mt-2 text-2xl font-black text-[#102015]">
                Issued receipts
              </h3>
            </div>
            <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">
              {receipts.length}
            </span>
          </div>

          <div className="mt-6 grid gap-3">
            {receipts.length === 0 ? (
              <p className="rounded-2xl bg-[#f7f5ec] p-5 text-sm text-[#405348]">
                No receipts issued yet.
              </p>
            ) : (
              receipts.map((receipt) => (
                <div key={receipt.id} className="rounded-2xl border border-[#102015]/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[#102015]">{receipt.code}</p>
                      <p className="text-sm text-[#405348]">
                        Order{" "}
                        <Link
                          href={`/buyer-account/orders/${receipt.orderId}`}
                          className="font-black text-[#1f7a3f] underline underline-offset-4"
                        >
                          {receipt.order.code}
                        </Link>{" "}
                        · Issued {formatDate(receipt.issuedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#102015]">{formatNaira(receipt.amount)}</p>
                      <BuyerMessageStatusPill status={receipt.status} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </BuyerPortalFrame>
  );
}
