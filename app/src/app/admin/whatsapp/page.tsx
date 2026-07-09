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

export default async function AdminWhatsAppPage() {
  await requireStaff();

  const [
    inboundBuyerMessages,
    inboundUnknownMessages,
    whatsappDrafts,
    pendingPaymentRequests,
    activeDeliveries,
    openComplaints,
    availableProducts,
  ] = await Promise.all([
    prisma.buyerMessage.findMany({
      where: {
        channel: "WhatsApp",
        direction: "Inbound",
      },
      orderBy: {createdAt: "desc"},
      take: 50,
      select: {
        id: true,
        metadata: true,
      },
    }),
    prisma.contactEnquiry.findMany({
      where: {
        enquiryType: "WhatsApp inbound",
      },
      orderBy: {createdAt: "desc"},
      take: 50,
      select: {
        id: true,
        adminNote: true,
      },
    }),
    prisma.orderRequest.count({
      where: {
        source: "WhatsApp inbound draft",
        status: {
          not: "Converted to order",
        },
      },
    }),
    prisma.paymentRequest.count({
      where: {
        status: "Pending",
      },
    }),
    prisma.delivery.count({
      where: {
        status: {
          notIn: ["Delivered", "Cancelled"],
        },
      },
    }),
    prisma.complaint.count({
      where: {
        status: {
          notIn: ["Resolved", "Closed"],
        },
      },
    }),
    prisma.product.count({
      where: {
        status: "Active",
        OR: [
          {availability: "Available"},
          {availability: "In stock"},
          {availability: "Active"},
          {availability: "Limited"},
          {availability: "Seasonal"},
        ],
      },
    }),
  ]);

  const allIntents = [
    ...inboundBuyerMessages.map((message) => parseNote(message.metadata).intent || "general"),
    ...inboundUnknownMessages.map((message) => parseNote(message.adminNote).intent || "general"),
  ];

  const intentCounts = allIntents.reduce<Record<string, number>>((counts, intent) => {
    counts[intent] = (counts[intent] || 0) + 1;
    return counts;
  }, {});

  const catalogueEnquiries =
    (intentCounts.product_price_enquiry || 0) + (intentCounts.availability_enquiry || 0);

  const followUps =
    (intentCounts.payment_follow_up || 0) +
    (intentCounts.delivery_follow_up || 0) +
    (intentCounts.complaint || 0);

  const cards = [
    {
      label: "Templates",
      value: availableProducts,
      caption: "available products",
      href: "/admin/whatsapp-tools",
      tone: "green",
    },
    {
      label: "Message inbox",
      value: inboundBuyerMessages.length + inboundUnknownMessages.length,
      caption: "new messages",
      href: "/admin/whatsapp-inbox",
      tone: "neutral",
    },
    {
      label: "Draft orders",
      value: whatsappDrafts,
      caption: "drafts",
      href: "/admin/whatsapp-drafts",
      tone: "amber",
    },
    {
      label: "Payment requests",
      value: pendingPaymentRequests,
      caption: "pending payment",
      href: "/admin/payment-requests",
      tone: "amber",
    },
    {
      label: "Deliveries",
      value: activeDeliveries,
      caption: "active delivery records",
      href: "/admin/deliveries",
      tone: "neutral",
    },
    {
      label: "Complaints",
      value: openComplaints,
      caption: "open complaint records",
      href: "/admin/complaints",
      tone: "red",
    },
  ];

  function cardClassName(tone: string) {
    if (tone === "green") return "border-[#1f7a3f]/20 bg-[#eef6ea]";
    if (tone === "amber") return "border-[#7a4a00]/20 bg-[#fff6d6]";
    if (tone === "red") return "border-[#9b2f12]/20 bg-[#fff4ef]";
    return "border-[#102015]/10 bg-white";
  }

  return (
    <AdminPage
      title="Message centre"
      subtitle="Buyer messaging hub for product enquiries, order drafts, payment follow-up, delivery updates and support."
    >
      <section className="rounded-[2rem] bg-[#102015] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">
              Buyer communications
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Manage buyer messages and follow-up
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/75">
              Use this hub to share product availability, review inbound messages, convert order drafts, follow payments, assign deliveries and handle complaints.
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
              href="/admin/whatsapp-tools"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Templates
            </Link>
            <Link
              href="/admin/whatsapp-inbox"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Open inbox
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-[2rem] border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${cardClassName(card.tone)}`}
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#405348]">
              {card.label}
            </p>
            <p className="mt-3 text-4xl font-black text-[#102015]">
              {card.value}
            </p>
            <p className="mt-2 text-sm font-bold text-[#405348]">
              {card.caption}
            </p>
          </Link>
        ))}
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
          Message intent mix
        </p>
        <h3 className="mt-2 text-2xl font-black text-[#102015]">
          What buyers are asking about
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
          These counts come from recent inbound buyer messages and help staff see whether buyers are checking products, placing orders, chasing payments or raising delivery/support issues.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Product discovery", catalogueEnquiries],
            ["Order intent", intentCounts.order_intent || 0],
            ["Payment follow-up", intentCounts.payment_follow_up || 0],
            ["Delivery follow-up", intentCounts.delivery_follow_up || 0],
            ["Complaints", intentCounts.complaint || 0],
            ["Support", intentCounts.support || 0],
            ["General", intentCounts.general || 0],
            ["Urgent follow-ups", followUps],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl bg-[#f7f5ec] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#405348]">
                {label}
              </p>
              <p className="mt-2 text-2xl font-black text-[#102015]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/admin/products"
          className="rounded-[2rem] bg-white p-6 shadow-sm hover:bg-[#f3f8ef]"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
            Catalogue source
          </p>
          <h3 className="mt-2 text-xl font-black text-[#102015]">
            Product catalogue
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#405348]">
            Update products, prices, grades and availability here. Buyer product messages pull from this source.
          </p>
        </Link>

        <Link
          href="/admin/whatsapp-orders/new"
          className="rounded-[2rem] bg-white p-6 shadow-sm hover:bg-[#f3f8ef]"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
            Manual conversion
          </p>
          <h3 className="mt-2 text-xl font-black text-[#102015]">
            Create assisted order
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#405348]">
            Use when staff need to create a confirmed order directly from a buyer conversation.
          </p>
        </Link>

        <Link
          href="/admin/buyer-messages"
          className="rounded-[2rem] bg-white p-6 shadow-sm hover:bg-[#f3f8ef]"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
            Evidence
          </p>
          <h3 className="mt-2 text-xl font-black text-[#102015]">
            Buyer message log
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#405348]">
            Review outbound and inbound buyer messages retained as operational evidence.
          </p>
        </Link>
      </section>
    </AdminPage>
  );
}
