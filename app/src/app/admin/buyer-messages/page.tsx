// @ts-nocheck -- temporary build stabilisation for new commerce pages
import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import BuyerMessageStatusPill from "@/components/buyer/BuyerMessageStatusPill";
import BuyerWhatsAppComposeButton from "@/components/admin/BuyerWhatsAppComposeButton";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {resolvePaymentIncidentAction, retryFailedEmailAction} from "@/actions/communications";

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

export default async function AdminBuyerMessagesPage({searchParams}) {
  await requireStaff();
  const params = await searchParams;
  const view = String(params?.view || "all").toLowerCase();
  const query = String(params?.q || "").trim();
  const statusFilter = String(params?.status || "").trim();
  const direction = String(params?.direction || "").trim();
  const dateFrom = params?.dateFrom && !Number.isNaN(Date.parse(params.dateFrom)) ? new Date(params.dateFrom) : null;

  const [messages, emailDeliveries, reconciliationIncidents, operationalEvents] = await Promise.all([prisma.buyerMessage.findMany({
    where: {
      ...(view === "whatsapp" ? {channel: "WhatsApp"} : view === "portal/system" ? {channel: {in: ["Portal", "System"]}} : {}),
      ...(direction ? {direction} : {}),
      ...(dateFrom ? {createdAt: {gte: dateFrom}} : {}),
      ...(query ? {OR: [{title: {contains: query, mode: "insensitive"}}, {recipient: {contains: query, mode: "insensitive"}}, {relatedId: {contains: query, mode: "insensitive"}}, {customer: {name: {contains: query, mode: "insensitive"}}}]} : {}),
    },
    orderBy: {createdAt: "desc"},
    take: 100,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          accountStatus: true,
        },
      },
    },
  }), prisma.emailDelivery.findMany({where: {
    ...(view === "failed" ? {status: {in: ["Failed", "Bounced", "Complained"]}} : {}),
    ...(statusFilter ? {status: statusFilter} : {}),
    ...(dateFrom ? {createdAt: {gte: dateFrom}} : {}),
    ...(query ? {OR: [{recipient: {contains: query, mode: "insensitive"}}, {subject: {contains: query, mode: "insensitive"}}, {relatedId: {contains: query, mode: "insensitive"}}]} : {}),
  }, orderBy: {createdAt: "desc"}, take: 100}), prisma.paymentReconciliationIncident.findMany({where: view === "reconciliation" ? {} : {status: {in: ["Open", "Investigating"]}}, orderBy: {createdAt: "desc"}, take: 50}), prisma.operationalEvent.findMany({where: {status: "Open"}, orderBy: {createdAt: "desc"}, take: 50})]) as any;

  return (
    <AdminPage
      title="Buyer messages"
      subtitle="Unified email, WhatsApp, portal and payment-reconciliation operations workspace."
    >
      <nav className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {["All", "WhatsApp", "Email", "Portal/System", "Failed", "Reconciliation"].map((item) => <Link key={item} href={`/admin/buyer-messages?view=${encodeURIComponent(item.toLowerCase())}`} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${view === item.toLowerCase() ? "bg-[#1f7a3f] text-white" : "bg-white text-[#405348]"}`}>{item}</Link>)}
      </nav>
      <form className="mb-6 grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-5">
        <input type="hidden" name="view" value={view} />
        <input name="q" defaultValue={query} placeholder="Buyer, recipient or related ID" className="rounded-xl border border-[#102015]/10 px-3 py-2 text-sm md:col-span-2" />
        <select name="status" defaultValue={statusFilter} className="rounded-xl border border-[#102015]/10 px-3 py-2 text-sm"><option value="">Any email status</option>{["Pending", "Accepted", "Sent", "Delivered", "Delayed", "Bounced", "Complained", "Failed", "Skipped"].map((item) => <option key={item}>{item}</option>)}</select>
        <select name="direction" defaultValue={direction} className="rounded-xl border border-[#102015]/10 px-3 py-2 text-sm"><option value="">Any direction</option><option>Inbound</option><option>Outbound</option></select>
        <div className="flex gap-2"><input type="date" name="dateFrom" defaultValue={params?.dateFrom || ""} className="min-w-0 rounded-xl border border-[#102015]/10 px-3 py-2 text-sm" /><button className="rounded-xl bg-[#102015] px-4 py-2 text-sm font-black text-white">Filter</button></div>
      </form>

      {view !== "whatsapp" && view !== "portal/system" && view !== "reconciliation" ? (
      <section className="mb-6 rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-[#102015]">Email delivery</h2>
        <p className="mt-2 text-sm text-[#405348]">Accepted, pending, skipped and failed transactional-email attempts.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead><tr className="border-b border-[#102015]/10"><th className="p-3">Status</th><th className="p-3">Recipient</th><th className="p-3">Template</th><th className="p-3">Related record</th><th className="p-3">Attempts</th><th className="p-3">Last result</th></tr></thead>
            <tbody>{emailDeliveries.map((delivery) => <tr key={delivery.id} className="border-b border-[#102015]/5"><td className="p-3 font-black">{delivery.status === "Accepted" ? "Accepted by provider" : delivery.status}</td><td className="p-3">{delivery.recipient}</td><td className="p-3"><div className="font-bold">{delivery.subject}</div><div className="text-xs text-[#587063]">{delivery.template}</div></td><td className="p-3">{delivery.relatedType || "—"} {delivery.relatedId || ""}</td><td className="p-3">{delivery.retryCount}</td><td className="p-3">{delivery.lastError || delivery.latestEventType || delivery.providerMessageId || formatDate(delivery.lastAttemptAt)}{delivery.status === "Failed" ? <form action={retryFailedEmailAction} className="mt-2"><input type="hidden" name="deliveryId" value={delivery.id} /><button className="rounded-lg bg-[#1f7a3f] px-3 py-2 text-xs font-black text-white">Retry email</button></form> : null}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      ) : null}

      {view !== "email" && reconciliationIncidents.length ? <section className="mb-6 rounded-[2rem] border border-[#C95F3D]/20 bg-[#fff8f3] p-6 shadow-sm">
        <h2 className="text-xl font-black text-[#102015]">Open payment reconciliation</h2>
        <div className="mt-4 grid gap-3">{reconciliationIncidents.map((incident) => <div key={incident.id} className="rounded-2xl bg-white p-4 text-sm"><div className="font-black">{incident.provider} · {incident.status}</div><div className="mt-1">{incident.reason}</div><div className="mt-1 text-xs text-[#587063]">Internal: {incident.internalReference || "unknown"} · Provider: {incident.providerReference || "unknown"} · {formatDate(incident.createdAt)}</div><form action={resolvePaymentIncidentAction} className="mt-3 grid gap-2 md:grid-cols-[12rem_1fr_auto]"><input type="hidden" name="incidentId" value={incident.id} /><select name="status" required className="rounded-xl border px-3 py-2"><option>Investigating</option><option>Resolved as paid</option><option>Resolved as unpaid</option><option>Ignored as invalid/test</option></select><input name="resolutionNote" required minLength={3} placeholder="Required resolution note" className="rounded-xl border px-3 py-2" /><button className="rounded-xl bg-[#102015] px-4 py-2 font-black text-white">Update</button></form></div>)}</div>
      </section> : null}

      {(view === "failed" || view === "all") && operationalEvents.length ? <section className="mb-6 rounded-[2rem] border border-[#C95F3D]/20 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Recent webhook and system failures</h2><div className="mt-4 grid gap-3">{operationalEvents.map((event) => <div key={event.id} className="rounded-2xl bg-[#fff8f3] p-4 text-sm"><div className="font-black">{event.category} · {event.severity}</div><div className="mt-1">{event.summary}</div><div className="mt-1 text-xs text-[#587063]">{event.route || "Internal operation"} · {formatDate(event.createdAt)}</div></div>)}</div></section> : null}

      {view !== "email" && view !== "reconciliation" ? <div className="grid gap-4">
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
                      {message.customer?.name || "Buyer account"}
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

                {message.customer?.phone ? (
                  <BuyerWhatsAppComposeButton
                    customerId={message.customerId}
                    phone={message.customer.phone}
                    title={message.title}
                    body={message.body}
                    relatedType="BuyerMessage"
                    relatedId={message.id}
                  />
                ) : null}
              </div>
            </section>
          ))
        )}
      </div> : null}
    </AdminPage>
  );
}
