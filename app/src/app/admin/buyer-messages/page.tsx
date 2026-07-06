import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import BuyerMessageStatusPill from "@/components/buyer/BuyerMessageStatusPill";
import BuyerWhatsAppComposeButton from "@/components/admin/BuyerWhatsAppComposeButton";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDate(value: Date | string | null) {
  if (!value) return "Not sent";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AdminBuyerMessagesPage() {
  await requireStaff();

  const messages = await prisma.buyerMessage.findMany({
    orderBy: {createdAt: "desc"},
    take: 100,
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          phoneNormalized: true,
          emailNormalized: true,
          accountStatus: true,
        },
      },
    },
  });

  return (
    <AdminPage
      title="Buyer messages"
      subtitle="Communication evidence log for buyer account, order, payment and WhatsApp activity."
    >
      <div className="grid gap-4">
        {messages.length === 0 ? (
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#102015]">No buyer messages logged yet</h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              Prepared WhatsApp messages, account notices and buyer inbox updates will appear here.
            </p>
          </section>
        ) : (
          messages.map((message) => (
            <section key={message.id} className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <BuyerMessageStatusPill status={message.status} />
                    <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black text-[#405348]">
                      {message.channel}
                    </span>
                    <span className="rounded-full bg-[#f1eee4] px-3 py-1 text-xs font-black text-[#405348]">
                      {message.direction}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-black text-[#102015]">
                    {message.title}
                  </h2>

                  <p className="mt-2 text-sm font-bold text-[#405348]">
                    Buyer:{" "}
                    <Link
                      href={`/admin/customers/${message.customerId}`}
                      className="text-[#1f7a3f] underline underline-offset-4"
                    >
                      {message.customer?.fullName || "Buyer account"}
                    </Link>
                  </p>
                </div>

                <div className="text-right text-sm text-[#405348]">
                  <p className="font-black text-[#102015]">{formatDate(message.createdAt)}</p>
                  <p>{message.recipient || "No recipient recorded"}</p>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#405348]">
                {message.body}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#102015]/10 pt-4">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a7d55]">
                  {message.source || "Message log"}
                  {message.relatedType ? ` · ${message.relatedType}` : ""}
                </div>

                {message.customer?.phoneNormalized ? (
                  <BuyerWhatsAppComposeButton
                    customerId={message.customerId}
                    customerName={message.customer.fullName || "Buyer"}
                    phone={message.customer.phoneNormalized}
                    title={message.title}
                    body={message.body}
                    source="Admin buyer message log"
                    relatedType="BuyerMessage"
                    relatedId={message.id}
                  />
                ) : null}
              </div>
            </section>
          ))
        )}
      </div>
    </AdminPage>
  );
}
