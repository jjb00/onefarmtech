import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseNote(note: string | null | undefined) {
  try {
    return JSON.parse(note || "{}");
  } catch {
    return {};
  }
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClass(status: string | null | undefined) {
  const key = String(status || "").toLowerCase();

  if (
    key.includes("paid") ||
    key.includes("sent") ||
    key.includes("delivered") ||
    key.includes("converted") ||
    key.includes("complete")
  ) {
    return "bg-[#eef6ea] text-[#1f7a3f]";
  }

  if (
    key.includes("complaint") ||
    key.includes("failed") ||
    key.includes("issue") ||
    key.includes("cancelled")
  ) {
    return "bg-[#fff4ef] text-[#9b2f12]";
  }

  return "bg-[#fff6d6] text-[#7a4a00]";
}

function actionButtonClass(tone: "green" | "amber" | "red" | "neutral") {
  if (tone === "green") {
    return "rounded-full bg-[#1f7a3f] px-4 py-2 text-xs font-black text-white hover:bg-[#155c2f]";
  }

  if (tone === "amber") {
    return "rounded-full bg-[#fff6d6] px-4 py-2 text-xs font-black text-[#7a4a00] hover:bg-[#ffe9a6]";
  }

  if (tone === "red") {
    return "rounded-full bg-[#fff4ef] px-4 py-2 text-xs font-black text-[#9b2f12] hover:bg-[#ffe0d4]";
  }

  return "rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-xs font-black text-[#102015] hover:bg-[#f3f8ef]";
}

export default async function AdminWhatsAppWorkflowPage() {
  await requireStaff();

  const [
    inboundBuyerMessages,
    inboundUnknownMessages,
    draftOrders,
    pendingPaymentRequests,
    activeDeliveries,
    openComplaints,
    activeProducts,
    latestPaymentMessages,
  ] = await Promise.all([
    prisma.buyerMessage.findMany({
      where: {
        channel: "WhatsApp",
        direction: "Inbound",
      },
      orderBy: {createdAt: "desc"},
      take: 30,
      select: {
        id: true,
        title: true,
        body: true,
        status: true,
        recipient: true,
        metadata: true,
        customerId: true,
        createdAt: true,
      },
    }),
    prisma.contactEnquiry.findMany({
      where: {
        enquiryType: "WhatsApp inbound",
      },
      orderBy: {createdAt: "desc"},
      take: 30,
      select: {
        id: true,
        name: true,
        phone: true,
        message: true,
        status: true,
        adminNote: true,
        createdAt: true,
      },
    }),
    prisma.orderRequest.findMany({
      where: {
        source: "WhatsApp inbound draft",
        status: {
          not: "Converted to order",
        },
      },
      orderBy: {createdAt: "desc"},
      take: 10,
      select: {
        id: true,
        buyerName: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.paymentRequest.findMany({
      where: {
        status: {
          notIn: ["Paid", "Cancelled", "Failed"],
        },
      },
      orderBy: {createdAt: "desc"},
      take: 10,
      select: {
        id: true,
        reference: true,
        status: true,
        amount: true,
        currency: true,
        paymentUrl: true,
        order: {
          select: {
            id: true,
            code: true,
            buyerName: true,
            phone: true,
          },
        },
      },
    }),
    prisma.delivery.findMany({
      where: {
        status: {
          notIn: ["Delivered", "Cancelled"],
        },
      },
      orderBy: {createdAt: "desc"},
      take: 10,
      select: {
        id: true,
        status: true,
        deliveryArea: true,
        trackingReference: true,
        deliveryPartnerName: true,
        order: {
          select: {
            id: true,
            code: true,
            buyerName: true,
          },
        },
      },
    }),
    prisma.complaint.findMany({
      where: {
        status: {
          notIn: ["Resolved", "Closed"],
        },
      },
      orderBy: {createdAt: "desc"},
      take: 10,
      select: {
        id: true,
        code: true,
        issue: true,
        priority: true,
        status: true,
        createdAt: true,
        order: {
          select: {
            id: true,
            code: true,
            buyerName: true,
          },
        },
      },
    }),
    prisma.product.count({
      where: {
        status: "Active",
      },
    }),
    prisma.buyerMessage.findMany({
      where: {
        channel: "WhatsApp",
        direction: "Outbound",
        relatedType: "PaymentRequest",
      },
      orderBy: {createdAt: "desc"},
      take: 10,
      select: {
        id: true,
        title: true,
        recipient: true,
        status: true,
        sentAt: true,
        createdAt: true,
      },
    }),
  ]);

  const allInboundIntents = [
    ...inboundBuyerMessages.map((message) => parseNote(message.metadata).intent || "general"),
    ...inboundUnknownMessages.map((message) => parseNote(message.adminNote).intent || "general"),
  ];

  const intentCounts = allInboundIntents.reduce<Record<string, number>>((counts, intent) => {
    counts[intent] = (counts[intent] || 0) + 1;
    return counts;
  }, {});

  const productEnquiries =
    (intentCounts.product_price_enquiry || 0) + (intentCounts.availability_enquiry || 0);

  const paymentFollowUps = intentCounts.payment_follow_up || 0;
  const deliveryFollowUps = intentCounts.delivery_follow_up || 0;
  const complaintIntents = intentCounts.complaint || 0;

  const todayCards = [
    {
      title: "Start here",
      value: activeProducts,
      caption: "active products",
      href: "/admin/whatsapp-tools",
      action: "Send update",
      tone: "green" as const,
    },
    {
      title: "New inbound",
      value: inboundBuyerMessages.length + inboundUnknownMessages.length,
      caption: "recent buyer messages",
      href: "/admin/whatsapp-inbox",
      action: "Open inbox",
      tone: "neutral" as const,
    },
    {
      title: "Draft orders",
      value: draftOrders.length,
      caption: "need conversion",
      href: "/admin/whatsapp-drafts",
      action: "Convert drafts",
      tone: "green" as const,
    },
    {
      title: "Product enquiries",
      value: productEnquiries,
      caption: "asking price/availability",
      href: "/admin/whatsapp-tools",
      action: "Send product list",
      tone: "green" as const,
    },
    {
      title: "Payment work",
      value: pendingPaymentRequests.length + paymentFollowUps,
      caption: "requests/follow-ups",
      href: "/admin/payment-requests",
      action: "Review payments",
      tone: "amber" as const,
    },
    {
      title: "Delivery work",
      value: activeDeliveries.length + deliveryFollowUps,
      caption: "active/follow-ups",
      href: "/admin/deliveries",
      action: "Review deliveries",
      tone: "amber" as const,
    },
    {
      title: "Complaints",
      value: openComplaints.length + complaintIntents,
      caption: "open or flagged",
      href: "/admin/complaints",
      action: "Resolve issues",
      tone: "red" as const,
    },
    {
      title: "Evidence",
      value: latestPaymentMessages.length,
      caption: "recent payment messages",
      href: "/admin/buyer-messages",
      action: "Message log",
      tone: "neutral" as const,
    },
  ];

  const checklist = [
    {
      step: "1",
      title: "Send buyer menu",
      check: "Send the guided menu to a test buyer number.",
      expected: "Outbound buyer message is sent and logged as evidence.",
      href: "/admin/whatsapp-tools",
    },
    {
      step: "2",
      title: "Test menu replies",
      check: "Reply as buyer with 1, 2, 3, 4, 5 or 6.",
      expected: "Inbound Message inbox classifies intent correctly.",
      href: "/admin/whatsapp-inbox",
    },
    {
      step: "3",
      title: "Send product list",
      check: "For option 1 or product enquiry, send the live product list.",
      expected: "Product list uses active catalogue records and creates evidence.",
      href: "/admin/whatsapp-tools",
    },
    {
      step: "4",
      title: "Convert order draft",
      check: "For option 2/order intent, open draft and convert to order.",
      expected: "Order is created with WhatsApp context preserved.",
      href: "/admin/whatsapp-drafts",
    },
    {
      step: "5",
      title: "Create payment request",
      check: "Open the order and create a payment request.",
      expected: "Payment request appears on order and payment request page.",
      href: "/admin/orders",
    },
    {
      step: "6",
      title: "Generate payment link",
      check: "Generate Paystack or Flutterwave checkout link.",
      expected: "Payment URL is saved against the payment request.",
      href: "/admin/payment-requests",
    },
    {
      step: "7",
      title: "Send payment request",
      check: "Send the payment request to the buyer.",
      expected: "Outbound payment message is sent and logged once.",
      href: "/admin/payment-requests",
    },
    {
      step: "8",
      title: "Confirm payment webhook",
      check: "Use provider webhook simulator or real checkout test.",
      expected: "Payment request/order move to paid status.",
      href: "/admin/payment-requests",
    },
    {
      step: "9",
      title: "Assign delivery",
      check: "Open the paid order and save delivery handoff.",
      expected: "Delivery record exists with partner/status/tracking details.",
      href: "/admin/deliveries",
    },
    {
      step: "10",
      title: "Check support paths",
      check: "Send payment, delivery and complaint follow-up messages.",
      expected: "Inbox routes messages to payment, delivery or complaint queues.",
      href: "/admin/whatsapp-inbox",
    },
  ];

  return (
    <AdminPage
      title="Workflow test"
      subtitle="Launch QA checklist for product discovery, ordering, payment, delivery and support."
    >
      <section className="rounded-[2rem] bg-[#102015] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">
              Launch QA
            </p>
            <h2 className="mt-3 text-3xl font-black">
              End-to-end workflow test
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/75">
              Use this page to verify the full order path before handover, demo or production launch. It is not the main daily staff desk.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/operations"
              className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
            >
              Order desk
            </Link>
            <Link
              href="/admin/whatsapp-inbox"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Inbox
            </Link>
          </div>
        </div>
      </section>

      <details className="rounded-[2rem] bg-white p-6 shadow-sm">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a7d55]">
                Current queue snapshot
              </p>
              <h3 className="mt-2 text-2xl font-black text-[#102015]">
                Records used by this test
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#405348]">
                Open this only when validating the workflow. Day-to-day teams should use Order desk, Message centre, Orders and Payments.
              </p>
            </div>
            <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">
              Open
            </span>
          </div>
        </summary>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {todayCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-[2rem] border border-[#102015]/10 bg-[#fbfff8] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#405348]">
                {card.title}
              </p>
              <p className="mt-3 text-4xl font-black text-[#102015]">
                {card.value}
              </p>
              <p className="mt-1 text-sm font-bold text-[#405348]">
                {card.caption}
              </p>
              <span className={`mt-4 inline-flex ${actionButtonClass(card.tone)}`}>
                {card.action}
              </span>
            </Link>
          ))}
        </div>
      </details>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                End-to-end test harness
              </p>
              <h3 className="mt-2 text-2xl font-black text-[#102015]">
                Workflow test checklist
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
                Use this checklist before handover or demo. Each row links to the relevant operating page.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {checklist.map((item) => (
              <Link
                key={item.step}
                href={item.href}
                className="grid gap-4 rounded-2xl border border-[#102015]/10 bg-[#f7f5ec] p-4 hover:bg-[#eef6ea] md:grid-cols-[auto_1fr_auto]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f7a3f] text-sm font-black text-white">
                  {item.step}
                </span>
                <span>
                  <span className="block font-black text-[#102015]">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-[#405348]">
                    {item.check}
                  </span>
                  <span className="mt-1 block text-xs font-bold leading-6 text-[#405348]">
                    Expected: {item.expected}
                  </span>
                </span>
                <span className="self-center rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-xs font-black text-[#102015]">
                  Open
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="grid gap-5">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Active issues
            </p>
            <h3 className="mt-2 text-xl font-black text-[#102015]">
              Complaints and urgent follow-ups
            </h3>

            <div className="mt-5 grid gap-3">
              {openComplaints.length === 0 ? (
                <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm leading-7 text-[#405348]">
                  No open complaints in the current queue.
                </p>
              ) : (
                openComplaints.slice(0, 5).map((complaint) => (
                  <Link
                    key={complaint.id}
                    href="/admin/complaints"
                    className="rounded-2xl bg-[#fff4ef] p-4 hover:bg-[#ffe0d4]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-black text-[#102015]">
                        {complaint.code}
                      </p>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#405348]">
                      {complaint.issue}
                    </p>
                    <p className="mt-2 text-xs font-bold text-[#405348]">
                      {complaint.order?.code || "No order"} · {formatDate(complaint.createdAt)}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Recent payment messages
            </p>
            <h3 className="mt-2 text-xl font-black text-[#102015]">
              Evidence check
            </h3>

            <div className="mt-5 grid gap-3">
              {latestPaymentMessages.length === 0 ? (
                <p className="rounded-2xl bg-[#f7f5ec] p-4 text-sm leading-7 text-[#405348]">
                  No recent payment messages found.
                </p>
              ) : (
                latestPaymentMessages.slice(0, 5).map((message) => (
                  <Link
                    key={message.id}
                    href="/admin/buyer-messages"
                    className="rounded-2xl bg-[#f7f5ec] p-4 hover:bg-[#eef6ea]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-black text-[#102015]">
                        {message.title}
                      </p>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(message.status)}`}>
                        {message.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#405348]">
                      {message.recipient || "No recipient"} · {formatDate(message.sentAt || message.createdAt)}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </aside>
      </section>
    </AdminPage>
  );
}
