import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import {prisma} from "@/lib/prisma";
import {isOperationalUnknownWhatsAppContact} from "@/lib/whatsappClassification.js";
import {requireStaff} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LIMIT = 8;
const age = (value: Date) => {
  const hours = Math.max(0, Math.floor((Date.now() - value.getTime()) / 3_600_000));
  return hours < 24 ? `${hours}h old` : `${Math.floor(hours / 24)}d old`;
};

type QueueItem = {id: string; title: string; detail: string; state: string; updatedAt: Date; href: string; action: string};

function Queue({title, items, allHref}: {title: string; items: QueueItem[]; allHref: string}) {
  return (
    <section className="rounded-2xl border border-[#102015]/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">{title}</h2><Link href={allHref} className="min-h-11 rounded-full px-4 py-3 text-sm font-black text-[#1f7a3f]">View all</Link></div>
      <div className="mt-3 divide-y divide-[#102015]/10">
        {items.length ? items.map((item) => (
          <article key={item.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div><p className="font-black">{item.title}</p><p className="mt-1 text-sm text-[#405348]">{item.detail}</p><p className="mt-1 text-xs font-bold text-[#587063]">{item.state} · {age(item.updatedAt)}</p></div>
            <Link href={item.href} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1f7a3f] px-4 text-sm font-black text-white">{item.action}</Link>
          </article>
        )) : <p className="py-6 text-sm text-[#587063]">Nothing needs attention here.</p>}
      </div>
    </section>
  );
}

export default async function TodayPage({searchParams}: {searchParams?: Promise<{access?: string}>}) {
  const params = await searchParams;
  const staff = await requireStaff();
  const canOperate = ["Super admin", "Admin", "Operations"].includes(staff.role);
  const canFinance = ["Super admin", "Admin", "Finance"].includes(staff.role);
  const canSupport = ["Super admin", "Admin", "Support", "Operations"].includes(staff.role);
  const canManageBuyers = ["Super admin", "Admin", "Support", "Buyer account manager"].includes(staff.role);
  const [requests, orders, paymentRequests, deliveries, buyerRequests, whatsappCandidates, complaints] = await Promise.all([
    canOperate ? prisma.orderRequest.findMany({where: {status: {in: ["New", "Reviewing"]}}, orderBy: [{updatedAt: "asc"}, {id: "asc"}], take: LIMIT, select: {id: true, buyerName: true, items: true, status: true, updatedAt: true}}) : [],
    canOperate ? prisma.order.findMany({where: {OR: [
      {paymentStatus: {in: ["Unpaid", "Pending"]}},
      {fulfilmentStatus: {in: ["New order", "Pending", "Confirmed", "Preparing", "Ready for pickup", "Paid"]}},
      {complaints: {some: {status: {notIn: ["Resolved", "Closed"]}}}},
    ]}, orderBy: [{updatedAt: "asc"}, {id: "asc"}], take: LIMIT, select: {id: true, code: true, buyerName: true, paymentStatus: true, fulfilmentStatus: true, deliveryMethod: true, updatedAt: true}}) : [],
    canFinance ? prisma.paymentRequest.findMany({where: {OR: [{status: {in: ["Pending", "Failed", "Expired"]}}, {providerError: {not: null}}]}, orderBy: [{updatedAt: "asc"}, {id: "asc"}], take: LIMIT, select: {id: true, reference: true, status: true, provider: true, providerError: true, updatedAt: true, order: {select: {id: true, code: true, buyerName: true}}}}) : [],
    canOperate ? prisma.delivery.findMany({where: {status: {notIn: ["Delivered", "Collected", "Cancelled"]}}, orderBy: [{updatedAt: "asc"}, {id: "asc"}], take: LIMIT, select: {id: true, status: true, deliveryMethod: true, updatedAt: true, order: {select: {id: true, code: true, buyerName: true}}}}) : [],
    canManageBuyers ? prisma.buyerAccountRequest.findMany({where: {status: {in: ["New", "Reviewing"]}}, orderBy: [{updatedAt: "asc"}, {id: "asc"}], take: LIMIT, select: {id: true, contactName: true, organisationName: true, status: true, updatedAt: true}}) : [],
    canSupport ? prisma.contactEnquiry.findMany({where: {enquiryType: "WhatsApp inbound", status: {in: ["New", "Open"]}}, orderBy: [{updatedAt: "asc"}, {id: "asc"}], take: 40, select: {id: true, name: true, phone: true, message: true, status: true, source: true, enquiryType: true, adminNote: true, updatedAt: true}}) : [],
    canSupport ? prisma.complaint.findMany({where: {status: {notIn: ["Resolved", "Closed"]}}, orderBy: [{updatedAt: "asc"}, {id: "asc"}], take: LIMIT, select: {id: true, code: true, issue: true, status: true, updatedAt: true, order: {select: {id: true, code: true, buyerName: true}}}}) : [],
  ]);
  const whatsapp = whatsappCandidates.filter(isOperationalUnknownWhatsAppContact).slice(0, LIMIT);
  const queues = [
    {title: "New order requests", allHref: "/admin/orders?view=new-requests", items: requests.map((x) => ({id: x.id, title: x.buyerName, detail: x.items, state: x.status, updatedAt: x.updatedAt, href: `/admin/orders?view=new-requests&focus=${x.id}`, action: "Review request"}))},
    {title: "Orders needing action", allHref: "/admin/orders?view=needs-action", items: orders.map((x) => ({id: x.id, title: `${x.code} · ${x.buyerName}`, detail: `${x.paymentStatus} · ${x.deliveryMethod}`, state: x.fulfilmentStatus, updatedAt: x.updatedAt, href: `/admin/orders/${x.id}`, action: "Open order"}))},
    {title: "Payments to follow up", allHref: "/admin/payment-requests?view=needs-action", items: paymentRequests.map((x) => ({id: x.id, title: `${x.order.code} · ${x.order.buyerName}`, detail: x.providerError || `${x.provider} payment request`, state: x.status, updatedAt: x.updatedAt, href: `/admin/payment-requests?focus=${x.id}`, action: "Review payment"}))},
    {title: "Delivery and pickup", allHref: "/admin/deliveries", items: deliveries.map((x) => ({id: x.id, title: `${x.order.code} · ${x.order.buyerName}`, detail: x.deliveryMethod, state: x.status, updatedAt: x.updatedAt, href: `/admin/orders/${x.order.id}`, action: "Update fulfilment"}))},
    {title: "Buyer account requests", allHref: "/admin/customers?view=applications", items: buyerRequests.map((x) => ({id: x.id, title: x.organisationName || x.contactName, detail: "Buyer account approval requested", state: x.status, updatedAt: x.updatedAt, href: `/admin/customers?view=applications&focus=${x.id}`, action: "Review buyer"}))},
    {title: "Unknown WhatsApp order contacts", allHref: "/admin/buyer-messages?view=enquiries&type=WhatsApp+inbound", items: whatsapp.map((x) => ({id: x.id, title: x.name || x.phone || "Unknown contact", detail: x.message, state: x.status, updatedAt: x.updatedAt, href: `/admin/buyer-messages?view=enquiries&type=WhatsApp+inbound&focus=${x.id}`, action: "Review message"}))},
    {title: "Open customer complaints", allHref: "/admin/complaints", items: complaints.map((x) => ({id: x.id, title: `${x.code} · ${x.order.buyerName}`, detail: x.issue, state: x.status, updatedAt: x.updatedAt, href: `/admin/orders/${x.order.id}`, action: "Resolve issue"}))},
  ];
  return (
    <AdminShell title="Today" description="Operational work that needs a clear next action." compactHeader action={<Link href="/admin/create-order" className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white">Create order</Link>}>
      {params?.access === "denied" ? <p role="alert" className="mb-5 rounded-xl bg-[#fff4ef] p-4 font-bold text-[#9b2f12]">That page is not available for your role.</p> : null}
      <div className="grid gap-5 xl:grid-cols-2">{queues.filter((queue) => queue.items.length > 0).map((queue) => <Queue key={queue.title} {...queue} />)}</div>
    </AdminShell>
  );
}
