import Link from "next/link";
import {redirect} from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";
import {AdminEmptyState, AdminListToolbar, AdminPagination, AdminResultCount} from "@/components/admin/AdminListControls";
import {AdminStatusPill, adminToneFromStatus} from "@/components/admin/AdminViewControls";
import {updateOrderRequestStatusAction} from "@/actions/createAdminRecords";
import {prisma} from "@/lib/prisma";
import {adminListHref, adminResultRange, parseAdminPage, parseAdminPageSize} from "@/lib/adminListParams.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {searchParams?: Promise<Record<string, string | string[] | undefined>>};
type RequestRow = Awaited<ReturnType<typeof loadRequests>>[number];
const PATH = "/admin/order-requests";
const reviewStatuses = ["Reviewing", "Followed up on WhatsApp", "Closed", "Rejected"];

function value(input: string | string[] | undefined) { return String(Array.isArray(input) ? input[0] : input || "").trim(); }
function formatDate(input: Date) { return new Intl.DateTimeFormat("en-GB", {dateStyle: "medium", timeStyle: "short"}).format(input); }
function preview(input: string | null, length = 140) { const text = String(input || "").trim(); return text.length > length ? `${text.slice(0, length - 3).trimEnd()}…` : text; }
function note(input: string | null) { try { return JSON.parse(input || "{}"); } catch { return {}; } }
function isConverted(status: string) { return status === "Converted to order"; }

async function loadRequests(where: object, page: number, pageSize: number) {
  return prisma.orderRequest.findMany({where, orderBy: [{createdAt: "desc"}, {id: "desc"}], skip: (page - 1) * pageSize, take: pageSize});
}

export default async function OrderRequestsPage({searchParams}: PageProps) {
  const raw = await searchParams;
  const q = value(raw?.q); const status = value(raw?.status); const source = value(raw?.source); const buyerType = value(raw?.type); const conversion = value(raw?.conversion);
  const pageSize = parseAdminPageSize(value(raw?.pageSize)); const page = parseAdminPage(value(raw?.page));
  const params = {q, status, source, type: buyerType, conversion, pageSize};
  const where = {
    ...(q ? {OR: ["buyerName", "phone", "email", "location", "items", "message", "adminNote"].map((field) => ({[field]: {contains: q, mode: "insensitive" as const}}))} : {}),
    ...(status ? {status} : {}), ...(source ? {source} : {}), ...(buyerType ? {buyerType} : {}),
    ...(conversion === "converted" ? {status: "Converted to order"} : conversion === "not-converted" ? {status: {not: "Converted to order"}} : {}),
  };
  const [total, allTotal, statuses, sources, types] = await Promise.all([
    prisma.orderRequest.count({where}), prisma.orderRequest.count(),
    prisma.orderRequest.findMany({distinct: ["status"], select: {status: true}, orderBy: {status: "asc"}}),
    prisma.orderRequest.findMany({distinct: ["source"], select: {source: true}, orderBy: {source: "asc"}}),
    prisma.orderRequest.findMany({distinct: ["buyerType"], select: {buyerType: true}, orderBy: {buyerType: "asc"}}),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) redirect(adminListHref(PATH, params, {page: totalPages}));
  const requests = await loadRequests(where, page, pageSize);
  const range = adminResultRange(page, pageSize, total); const filtered = Boolean(q || status || source || buyerType || conversion);

  return <AdminPageShell title="Order requests" description="Review public requests and WhatsApp drafts before confirmed-order processing." compactHeader>
    <div className="grid gap-5">
      <nav aria-label="Related request queues" className="flex flex-wrap gap-2"><Link href="/admin/launch-inbox" className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-sm font-black text-[#405348] focus:outline-none focus:ring-2 focus:ring-[#1f7a3f]">Open Launch inbox</Link><Link href="/admin/whatsapp-drafts" className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-sm font-black text-[#405348] focus:outline-none focus:ring-2 focus:ring-[#1f7a3f]">View WhatsApp drafts</Link></nav>
      <AdminListToolbar search={q} searchLabel="Search order requests" searchPlaceholder="Requester, phone, location, items or message ID" pageSize={pageSize} resetHref={PATH} filters={[
        {name: "status", label: "Status", value: status, options: statuses.map(({status: item}) => ({value: item, label: item}))},
        {name: "source", label: "Source", value: source, options: sources.map(({source: item}) => ({value: item, label: item}))},
        {name: "type", label: "Buyer type", value: buyerType, options: types.map(({buyerType: item}) => ({value: item, label: item}))},
        {name: "conversion", label: "Conversion", value: conversion, options: [{value: "not-converted", label: "Not converted"}, {value: "converted", label: "Converted"}]},
      ]} />
      <div className="flex flex-wrap items-center justify-between gap-3"><AdminResultCount {...range} total={total} label="requests" /><p className="text-xs font-bold text-[#587063]">{allTotal.toLocaleString()} total records</p></div>
      {!requests.length ? <AdminEmptyState title={allTotal === 0 ? "No order requests yet" : "No matching order requests"} description={allTotal === 0 ? "Public requests and qualifying WhatsApp drafts will appear here." : "Try a different search term or clear one or more filters."} resetHref={filtered ? PATH : undefined} /> : <>
        <section className="hidden overflow-hidden rounded-2xl border border-[#102015]/10 bg-white shadow-sm md:block"><div className="overflow-x-auto"><table className="w-full min-w-[1000px] border-collapse text-left text-sm"><thead className="bg-[#f3f8ef] text-xs uppercase tracking-[0.12em] text-[#405348]"><tr><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Requester</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Request</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Manage</th></tr></thead><tbody>{requests.map((request) => <RequestTableRow key={request.id} request={request} />)}</tbody></table></div></section>
        <section className="grid gap-3 md:hidden">{requests.map((request) => <RequestMobileCard key={request.id} request={request} />)}</section>
      </>}
      <AdminPagination page={page} totalPages={totalPages} previousHref={page > 1 ? adminListHref(PATH, params, {page: page - 1}) : undefined} nextHref={page < totalPages ? adminListHref(PATH, params, {page: page + 1}) : undefined} />
    </div>
  </AdminPageShell>;
}

function RequestTableRow({request}: {request: RequestRow}) {
  return <tr className="border-t border-[#102015]/10 align-top"><td className="whitespace-nowrap px-4 py-4 text-[#405348]">{formatDate(request.createdAt)}</td><td className="px-4 py-4"><p className="font-black text-[#102015]">{request.buyerName || request.phone || "Unknown requester"}</p><p className="mt-1 text-xs leading-5 text-[#587063]">{request.phone || "No phone"}{request.email ? ` · ${request.email}` : ""}</p><p className="mt-1 text-xs text-[#405348]">{request.location || "No location"}</p></td><td className="px-4 py-4"><p className="font-bold text-[#102015]">{request.source}</p><p className="mt-1 text-xs text-[#587063]">{request.buyerType} · {request.deliveryPreference}</p></td><td className="max-w-sm px-4 py-4"><p className="leading-6 text-[#405348]">{preview(request.items) || "No item description"}</p>{request.message ? <p className="mt-1 text-xs text-[#587063]">{preview(request.message, 90)}</p> : null}</td><td className="px-4 py-4"><AdminStatusPill tone={adminToneFromStatus(request.status)}>{request.status}</AdminStatusPill>{isConverted(request.status) ? <p className="mt-2 text-xs font-bold text-[#1f7a3f]">Converted</p> : null}</td><td className="px-4 py-4"><RequestManage request={request} /></td></tr>;
}

function RequestMobileCard({request}: {request: RequestRow}) {
  return <article className="rounded-2xl border border-[#102015]/10 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-[#102015]">{request.buyerName || request.phone || "Unknown requester"}</h2><p className="mt-1 text-xs text-[#587063]">{formatDate(request.createdAt)}</p></div><AdminStatusPill tone={adminToneFromStatus(request.status)}>{request.status}</AdminStatusPill></div><p className="mt-3 text-xs font-bold text-[#587063]">{request.source} · {request.phone || request.email || "No contact detail"}</p><p className="mt-3 text-sm leading-6 text-[#405348]">{preview(request.items) || "No item description"}</p><div className="mt-4"><RequestManage request={request} /></div></article>;
}

function RequestManage({request}: {request: RequestRow}) {
  const metadata = note(request.adminNote); const converted = isConverted(request.status); const orderId = typeof metadata.convertedOrderId === "string" ? metadata.convertedOrderId : ""; const orderCode = typeof metadata.convertedOrderCode === "string" ? metadata.convertedOrderCode : ""; const canConvert = !converted && request.source === "WhatsApp inbound draft";
  return <details className="min-w-44"><summary className="cursor-pointer rounded-xl border border-[#102015]/15 px-3 py-2 text-center text-xs font-black text-[#102015] focus:outline-none focus:ring-2 focus:ring-[#1f7a3f]">Review request</summary><div className="mt-2 min-w-64 rounded-xl bg-[#f7f5ec] p-3"><p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-[#405348]"><strong className="text-[#102015]">Items:</strong> {request.items}</p>{request.message ? <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-[#405348]"><strong className="text-[#102015]">Message:</strong> {request.message}</p> : null}<div className="mt-3 grid gap-2">{converted && orderId ? <Link href={`/admin/orders/${orderId}`} className="rounded-lg bg-[#1f7a3f] px-3 py-2 text-center text-xs font-black text-white">Open {orderCode || "converted order"}</Link> : null}{converted && !orderId ? <p className="rounded-lg bg-[#fff6d6] p-2 text-xs font-bold text-[#7a4a00]">Marked converted; no resulting order link is stored.</p> : null}{canConvert ? <Link href={`/admin/whatsapp-orders/new?draftId=${request.id}`} className="rounded-lg bg-[#1f7a3f] px-3 py-2 text-center text-xs font-black text-white">Convert WhatsApp draft</Link> : null}{!converted && !canConvert ? <p className="text-xs text-[#587063]">No linked conversion flow is stored for this request source.</p> : null}</div>{!converted ? <form action={updateOrderRequestStatusAction} className="mt-3 grid gap-2"><input type="hidden" name="requestId" value={request.id} /><label className="grid gap-1 text-xs font-black text-[#405348]">Review status<select name="status" defaultValue={request.status} className="rounded-lg border border-[#102015]/15 bg-white px-2 py-2 text-sm font-normal">{[...new Set([request.status, ...reviewStatuses])].map((item) => <option key={item}>{item}</option>)}</select></label><button className="rounded-lg bg-[#102015] px-3 py-2 text-xs font-black text-white">Update status</button></form> : null}</div></details>;
}
