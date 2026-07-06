import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import BuyerWhatsAppComposeButton from "@/components/admin/BuyerWhatsAppComposeButton";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BuyerMessagesAdminPage() {
  const messages = await prisma.buyerMessage.findMany({
    orderBy: {createdAt: "desc"},
    include: {customer: true},
    take: 150,
  });

  const whatsappCount = messages.filter((message) => message.channel === "WhatsApp").length;
  const emailCount = messages.filter((message) => message.channel === "Email").length;
  const portalCount = messages.filter((message) => message.channel === "Portal").length;

  return (
    <AdminPageShell
      title="Buyer message log"
      description="Evidence log for buyer notices, WhatsApp messages, email records, support updates and account communications."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Messages" value={String(messages.length)} />
          <Metric label="Portal" value={String(portalCount)} />
          <Metric label="WhatsApp" value={String(whatsappCount)} />
          <Metric label="Email" value={String(emailCount)} />
        </section>

        <section className="grid gap-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f7a3f]">
                    {message.channel} · {message.status}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#102015]">
                    {message.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#405348]">
                    {message.customer.name} · {message.createdAt.toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/admin/customers/${message.customerId}`}
                    className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white"
                  >
                    Open buyer
                  </Link>
                  <BuyerWhatsAppComposeButton
                    customerId={message.customerId}
                    phone={message.customer.phone}
                    title={`WhatsApp follow-up: ${message.title}`}
                    body={`Hello ${message.customer.name},\n\nFollowing up on: ${message.title}\n\n${message.body}\n\nOneFarmTech`}
                    relatedType={message.relatedType || "BuyerMessage"}
                    relatedId={message.relatedId || message.id}
                    label="WhatsApp follow-up"
                  />
                </div>
              </div>

              <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-[#f3f8ef] p-4 text-sm leading-7 text-[#102015]">
                {message.body}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#587063]">
                <span className="rounded-full bg-[#f7f5ec] px-3 py-1">
                  Source: {message.source}
                </span>
                {message.recipient ? (
                  <span className="rounded-full bg-[#f7f5ec] px-3 py-1">
                    Recipient: {message.recipient}
                  </span>
                ) : null}
                {message.relatedType ? (
                  <span className="rounded-full bg-[#f7f5ec] px-3 py-1">
                    Related: {message.relatedType}
                  </span>
                ) : null}
              </div>
            </article>
          ))}

          {!messages.length ? (
            <div className="rounded-[2rem] bg-white p-8 text-center text-[#405348] shadow-sm">
              No buyer messages have been logged yet.
            </div>
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 text-[#102015] shadow-sm">
      <p className="text-2xl font-black text-[#1f7a3f]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#405348]">{label}</p>
    </div>
  );
}
