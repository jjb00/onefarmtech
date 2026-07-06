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

  return (
    <AdminPage
      title="WhatsApp inbox"
      subtitle="Inbound WhatsApp webhook messages. Review first; do not auto-create orders from inbound messages yet."
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              WhatsApp operations
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              Inbound message review
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              Messages matched to buyer accounts are stored in buyer evidence logs. Unknown numbers are kept as WhatsApp enquiries until staff decide what to do.
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
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-[#f7f5ec] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#405348]">
              Matched
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
              Automation status
            </p>
            <p className="mt-2 font-black text-[#102015]">
              Review first
            </p>
          </div>
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
              matchedMessages.map((message) => (
                <article key={message.id} className="rounded-2xl border border-[#102015]/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[#102015]">{message.title}</p>
                      <p className="mt-1 text-sm text-[#405348]">
                        {message.customer?.name} · {message.recipient || message.customer?.phone}
                      </p>
                    </div>
                    <BuyerMessageStatusPill status={message.status} />
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#405348]">
                    {message.body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#405348]">
                    <span>{formatDate(message.createdAt)}</span>
                    <Link href={`/admin/customers/${message.customerId}`} className="text-[#1f7a3f] underline underline-offset-4">
                      Open buyer
                    </Link>
                  </div>
                </article>
              ))
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
              unmatchedMessages.map((message) => (
                <article key={message.id} className="rounded-2xl border border-[#102015]/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[#102015]">{message.name}</p>
                      <p className="mt-1 text-sm text-[#405348]">
                        {message.phone || "No phone"} · {message.status}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#fff6d6] px-3 py-1 text-xs font-black text-[#7a4a00]">
                      Unmatched
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#405348]">
                    {message.message}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#405348]">
                    <span>{formatDate(message.createdAt)}</span>
                    <Link href="/admin/contact-enquiries" className="text-[#1f7a3f] underline underline-offset-4">
                      Review enquiries
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </AdminPage>
  );
}
