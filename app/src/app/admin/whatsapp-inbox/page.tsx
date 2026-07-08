// @ts-nocheck -- operational inbox aggregates matched and unmatched WhatsApp inbound records
import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import BuyerMessageStatusPill from "@/components/buyer/BuyerMessageStatusPill";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

function parseNote(note: string | null | undefined) {
  try {
    return JSON.parse(note || "{}");
  } catch {
    return {};
  }
}

function intentAction(intent: string | null | undefined) {
  switch (intent) {
    case "product_price_enquiry":
    case "availability_enquiry":
      return {
        label: "Send product list",
        href: "/admin/whatsapp-tools",
        tone: "green",
      };
    case "order_intent":
      return {
        label: "Open draft orders",
        href: "/admin/whatsapp-drafts",
        tone: "green",
      };
    case "payment_follow_up":
      return {
        label: "Review payments",
        href: "/admin/payment-requests",
        tone: "amber",
      };
    case "delivery_follow_up":
      return {
        label: "Review deliveries",
        href: "/admin/deliveries",
        tone: "amber",
      };
    case "complaint":
      return {
        label: "Review complaints",
        href: "/admin/complaints",
        tone: "red",
      };
    case "support":
      return {
        label: "Support queue",
        href: "/admin/contact-enquiries",
        tone: "neutral",
      };
    default:
      return {
        label: "WhatsApp ops",
        href: "/admin/whatsapp",
        tone: "neutral",
      };
  }
}

function actionClassName(tone: string) {
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

export default async function AdminWhatsAppInboxPage() {
  await requireStaff();

  const [matchedMessages, unmatchedMessages] = await Promise.all([
    prisma.buyerMessage.findMany({
      where: {
        channel: "WhatsApp",
        direction: "Inbound",
      },
      orderBy: {createdAt: "desc"},
      take: 50,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            buyerType: true,
          },
        },
      },
    }),
    prisma.contactEnquiry.findMany({
      where: {
        enquiryType: "WhatsApp inbound",
      },
      orderBy: {createdAt: "desc"},
      take: 50,
    }),
  ]);

  const allInboundIntents = [
    ...matchedMessages.map((message) => parseNote(message.metadata).intent || "general"),
    ...unmatchedMessages.map((message) => parseNote(message.adminNote).intent || "general"),
  ];

  const intentCounts = allInboundIntents.reduce<Record<string, number>>((counts, intent) => {
    counts[intent] = (counts[intent] || 0) + 1;
    return counts;
  }, {});

  const urgentCount =
    (intentCounts.complaint || 0) +
    (intentCounts.payment_follow_up || 0) +
    (intentCounts.delivery_follow_up || 0);

  const catalogueCount =
    (intentCounts.product_price_enquiry || 0) +
    (intentCounts.availability_enquiry || 0);

  return (
    <AdminPage
      title="WhatsApp inbox"
      subtitle="Inbound WhatsApp storefront messages with buyer matching, intent classification, and draft-order routing."
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              WhatsApp storefront
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              Inbound message review
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              Messages are classified as order intent, product/price enquiry, availability enquiry, payment follow-up, delivery follow-up, complaint, support or general.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/whatsapp"
              className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
            >
              WhatsApp ops
            </Link>
            <Link
              href="/admin/whatsapp-tools"
              className="rounded-full bg-[#1f7a3f] px-4 py-2 text-sm font-black text-white hover:bg-[#155c2f]"
            >
              Message tools
            </Link>
            <Link
              href="/admin/whatsapp-drafts"
              className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
            >
              Draft orders
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-[#f7f5ec] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#405348]">
              Matched buyers
            </p>
            <p className="mt-2 text-3xl font-black text-[#102015]">
              {matchedMessages.length}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fff6d6] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a4a00]">
              Unknown numbers
            </p>
            <p className="mt-2 text-3xl font-black text-[#102015]">
              {unmatchedMessages.length}
            </p>
          </div>
          <div className="rounded-2xl bg-[#eef6ea] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
              Catalogue enquiries
            </p>
            <p className="mt-2 text-3xl font-black text-[#102015]">
              {catalogueCount}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fff4ef] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9b2f12]">
              Follow-up / complaint
            </p>
            <p className="mt-2 text-3xl font-black text-[#102015]">
              {urgentCount}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
          Operational routing
        </p>
        <h3 className="mt-2 text-2xl font-black text-[#102015]">
          What the inbox is seeing
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
          This gives staff a quick read of whether WhatsApp is being used for product discovery, orders, payment, delivery, complaints or support.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Order intent", intentCounts.order_intent || 0, "/admin/whatsapp-drafts"],
            ["Product / price", intentCounts.product_price_enquiry || 0, "/admin/whatsapp-tools"],
            ["Availability", intentCounts.availability_enquiry || 0, "/admin/whatsapp-tools"],
            ["Payment follow-up", intentCounts.payment_follow_up || 0, "/admin/payment-requests"],
            ["Delivery follow-up", intentCounts.delivery_follow_up || 0, "/admin/deliveries"],
            ["Complaints", intentCounts.complaint || 0, "/admin/complaints"],
            ["Support", intentCounts.support || 0, "/admin/contact-enquiries"],
            ["General", intentCounts.general || 0, "/admin/contact-enquiries"],
          ].map(([label, count, href]) => (
            <Link
              key={label}
              href={String(href)}
              className="rounded-2xl border border-[#102015]/10 bg-[#f7f5ec] p-4 hover:bg-[#eef6ea]"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#405348]">
                {label}
              </p>
              <p className="mt-2 text-2xl font-black text-[#102015]">{count}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            Matched buyers
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#102015]">
            Buyer evidence log
          </h3>

          <div className="mt-5 grid gap-3">
            {matchedMessages.length === 0 ? (
              <div className="rounded-2xl bg-[#f7f5ec] p-4 text-sm leading-7 text-[#405348]">
                No matched inbound WhatsApp messages yet.
              </div>
            ) : (
              matchedMessages.map((message) => {
                const metadata = parseNote(message.metadata);
                const action = intentAction(metadata.intent);

                return (
                  <article key={message.id} className="rounded-2xl border border-[#102015]/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-[#102015]">{message.title}</p>
                        <p className="mt-1 text-sm text-[#405348]">
                          {message.customer?.name} · {message.recipient || message.customer?.phone}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-[#405348]">
                          <span>Intent: {metadata.intent || "general"}</span>
                          <span>Confidence: {metadata.confidence || "Low"}</span>
                        </div>
                        <p className="mt-2 text-xs font-bold leading-6 text-[#405348]">
                          {metadata.intent === "product_price_enquiry" || metadata.intent === "availability_enquiry"
                            ? "Suggested action: send product list or confirm availability."
                            : metadata.intent === "payment_follow_up"
                              ? "Suggested action: check payment request and receipt status."
                              : metadata.intent === "delivery_follow_up"
                                ? "Suggested action: check delivery assignment/status."
                                : metadata.intent === "complaint"
                                  ? "Suggested action: open complaint/support follow-up."
                                  : metadata.intent === "order_intent"
                                    ? "Suggested action: review draft order queue."
                                    : "Suggested action: review and respond from WhatsApp ops."}
                        </p>
                      </div>
                      <BuyerMessageStatusPill status={message.status} />
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#405348]">
                      {message.body}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[#405348]">
                      <span>{formatDate(message.createdAt)}</span>
                      <Link href={`/admin/customers/${message.customerId}`} className="text-[#1f7a3f] underline underline-offset-4">
                        Open buyer
                      </Link>
                      <Link href={action.href} className={actionClassName(action.tone)}>
                        {action.label}
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7a4a00]">
            Unknown numbers
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#102015]">
            WhatsApp enquiries
          </h3>

          <div className="mt-5 grid gap-3">
            {unmatchedMessages.length === 0 ? (
              <div className="rounded-2xl bg-[#f7f5ec] p-4 text-sm leading-7 text-[#405348]">
                No unmatched inbound WhatsApp messages yet.
              </div>
            ) : (
              unmatchedMessages.map((message) => {
                const note = parseNote(message.adminNote);
                const action = intentAction(note.intent);

                return (
                  <article key={message.id} className="rounded-2xl border border-[#102015]/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-[#102015]">{message.name}</p>
                        <p className="mt-1 text-sm text-[#405348]">
                          {message.phone || "No phone"} · {message.status}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-[#405348]">
                          <span>Intent: {note.intent || "general"}</span>
                          <span>Confidence: {note.confidence || "Low"}</span>
                        </div>
                        <p className="mt-2 text-xs font-bold leading-6 text-[#405348]">
                          {note.intent === "product_price_enquiry" || note.intent === "availability_enquiry"
                            ? "Suggested action: send product list or confirm availability."
                            : note.intent === "payment_follow_up"
                              ? "Suggested action: check payment request and receipt status."
                              : note.intent === "delivery_follow_up"
                                ? "Suggested action: check delivery assignment/status."
                                : note.intent === "complaint"
                                  ? "Suggested action: open complaint/support follow-up."
                                  : note.intent === "order_intent"
                                    ? "Suggested action: review draft order queue."
                                    : "Suggested action: review and respond from WhatsApp ops."}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#fff6d6] px-3 py-1 text-xs font-black text-[#7a4a00]">
                        Unmatched
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#405348]">
                      {message.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[#405348]">
                      <span>{formatDate(message.createdAt)}</span>
                      <Link href="/admin/contact-enquiries" className="text-[#1f7a3f] underline underline-offset-4">
                        Review enquiries
                      </Link>
                      <Link href={action.href} className={actionClassName(action.tone)}>
                        {action.label}
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
          WhatsApp drafts
        </p>
        <h3 className="mt-2 text-2xl font-black text-[#102015]">
          Auto-drafted inbound orders
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
          Order-intent messages are routed into the draft order queue for staff review before confirmed order creation.
        </p>
        <Link
          href="/admin/whatsapp-drafts"
          className="mt-4 inline-flex rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white hover:bg-[#155c2f]"
        >
          Open WhatsApp drafts
        </Link>
      </section>
    </AdminPage>
  );
}
