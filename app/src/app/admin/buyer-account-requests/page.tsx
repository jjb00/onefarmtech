import Link from "next/link";
import {redirect} from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";
import {AdminEmptyState, AdminListToolbar, AdminPagination, AdminResultCount} from "@/components/admin/AdminListControls";
import {AdminStatusPill, adminToneFromStatus} from "@/components/admin/AdminViewControls";
import {convertBuyerAccountRequestToCustomerAction, updateBuyerAccountRequestStatusAction} from "@/actions/createAdminRecords";
import {prisma} from "@/lib/prisma";
import {adminListHref, adminResultRange, parseAdminPage, parseAdminPageSize} from "@/lib/adminListParams.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {searchParams?: Promise<Record<string, string | string[] | undefined>>};
type RequestRow = Awaited<ReturnType<typeof loadRequests>>[number];
const PATH = "/admin/buyer-account-requests";
const CONVERTED = "Converted to customer";
const CUSTOMER_NOTE_PREFIX = "Converted to customer record: ";
const reviewStatuses = ["Reviewing", "Rejected", "Closed"];

function value(input: string | string[] | undefined) { return String(Array.isArray(input) ? input[0] : input || "").trim(); }
function formatDate(input: Date) { return new Intl.DateTimeFormat("en-GB", {dateStyle: "medium", timeStyle: "short"}).format(input); }
function preview(input: string | null, length = 110) { const text = String(input || "").trim(); return text.length > length ? `${text.slice(0, length - 3).trimEnd()}…` : text; }
function customerIdFromRequest(request: {status: string; adminNote: string | null}) { if (request.status !== CONVERTED || !request.adminNote?.startsWith(CUSTOMER_NOTE_PREFIX)) return ""; return request.adminNote.slice(CUSTOMER_NOTE_PREFIX.length).trim(); }

async function loadRequests(where: object, page: number, pageSize: number) {
  return prisma.buyerAccountRequest.findMany({where, orderBy: [{createdAt: "desc"}, {id: "desc"}], skip: (page - 1) * pageSize, take: pageSize});
}

export default async function BuyerAccountRequestsPage({searchParams}: PageProps) {
  const raw = await searchParams;
  const q = value(raw?.q); const status = value(raw?.status); const source = value(raw?.source); const buyerType = value(raw?.type); const conversion = value(raw?.conversion);
  const pageSize = parseAdminPageSize(value(raw?.pageSize)); const page = parseAdminPage(value(raw?.page));
  const params = {q, status, source, type: buyerType, conversion, pageSize};
  const where = {
    ...(q ? {OR: ["contactName", "organisationName", "email", "phone", "location", "businessRegNumber", "usualProduceNeeds", "message", "adminNote"].map((field) => ({[field]: {contains: q, mode: "insensitive" as const}}))} : {}),
    ...(status ? {status} : {}), ...(source ? {source} : {}), ...(buyerType ? {buyerType} : {}),
    ...(conversion === "not-converted" ? {status: {not: CONVERTED}} : conversion === "linked" ? {status: CONVERTED, adminNote: {startsWith: CUSTOMER_NOTE_PREFIX}} : conversion === "unlinked" ? {status: CONVERTED, OR: [{adminNote: null}, {adminNote: {not: {startsWith: CUSTOMER_NOTE_PREFIX}}}]} : {}),
  };
  const [total, allTotal, statuses, sources, types] = await Promise.all([
    prisma.buyerAccountRequest.count({where}), prisma.buyerAccountRequest.count(),
    prisma.buyerAccountRequest.findMany({distinct: ["status"], select: {status: true}, orderBy: {status: "asc"}}),
    prisma.buyerAccountRequest.findMany({distinct: ["source"], select: {source: true}, orderBy: {source: "asc"}}),
    prisma.buyerAccountRequest.findMany({distinct: ["buyerType"], select: {buyerType: true}, orderBy: {buyerType: "asc"}}),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) redirect(adminListHref(PATH, params, {page: totalPages}));
  const requests = await loadRequests(where, page, pageSize);
  const customerIds = [...new Set(requests.map(customerIdFromRequest).filter(Boolean))];
  const existingCustomers = customerIds.length ? await prisma.customer.findMany({where: {id: {in: customerIds}}, select: {id: true, name: true}}) : [];
  const customers = new Map(existingCustomers.map((customer) => [customer.id, customer]));
  const range = adminResultRange(page, pageSize, total); const filtered = Boolean(q || status || source || buyerType || conversion);

  return <AdminPageShell title="Account requests" description="Review recurring-buyer applications before customer setup and access management." compactHeader>
    <div className="grid gap-5">
      <nav aria-label="Related buyer workflows" className="flex flex-wrap gap-2"><WorkflowLink href="/admin/launch-inbox" label="Open Launch inbox" /><WorkflowLink href="/admin/customers" label="View all buyers" /><WorkflowLink href="/admin/buyer-access" label="Manage buyer access" /></nav>
      <AdminListToolbar search={q} searchLabel="Search applications" searchPlaceholder="Applicant, organisation, phone, registration or notes" pageSize={pageSize} resetHref={PATH} filters={[
        {name: "status", label: "Status", value: status, options: statuses.map(({status: item}) => ({value: item, label: item}))},
        {name: "type", label: "Buyer type", value: buyerType, options: types.map(({buyerType: item}) => ({value: item, label: item}))},
        {name: "source", label: "Source", value: source, options: sources.map(({source: item}) => ({value: item, label: item}))},
        {name: "conversion", label: "Conversion", value: conversion, options: [{value: "not-converted", label: "Not converted"}, {value: "linked", label: "Converted with customer"}, {value: "unlinked", label: "Converted without link"}]},
      ]} />
      <div className="flex flex-wrap items-center justify-between gap-3"><AdminResultCount {...range} total={total} label="applications" /><p className="text-xs font-bold text-[#587063]">{allTotal.toLocaleString()} total records</p></div>
      {!requests.length ? <AdminEmptyState title={allTotal === 0 ? "No account requests yet" : "No matching account requests"} description={allTotal === 0 ? "New buyer applications will appear here." : "Try a different search term or clear one or more filters."} resetHref={filtered ? PATH : undefined} /> : <>
        <section className="hidden overflow-hidden rounded-2xl border border-[#102015]/10 bg-white shadow-sm md:block"><div className="overflow-x-auto"><table className="w-full min-w-[1000px] border-collapse text-left text-sm"><thead className="bg-[#f3f8ef] text-xs uppercase tracking-[0.12em] text-[#405348]"><tr><th className="px-4 py-3">Applied</th><th className="px-4 py-3">Applicant</th><th className="px-4 py-3">Business</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Conversion</th><th className="px-4 py-3">Review</th></tr></thead><tbody>{requests.map((request) => <RequestRow key={request.id} request={request} customer={customers.get(customerIdFromRequest(request))} />)}</tbody></table></div></section>
        <section className="grid gap-3 md:hidden">{requests.map((request) => <RequestCard key={request.id} request={request} customer={customers.get(customerIdFromRequest(request))} />)}</section>
      </>}
      <AdminPagination page={page} totalPages={totalPages} previousHref={page > 1 ? adminListHref(PATH, params, {page: page - 1}) : undefined} nextHref={page < totalPages ? adminListHref(PATH, params, {page: page + 1}) : undefined} />
    </div>
  </AdminPageShell>;
}

function WorkflowLink({href, label}: {href: string; label: string}) { return <Link href={href} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-sm font-black text-[#405348] focus:outline-none focus:ring-2 focus:ring-[#1f7a3f]">{label}</Link>; }
function ConversionState({request, customer}: {request: RequestRow; customer?: {id: string; name: string}}) { const id = customerIdFromRequest(request); if (request.status !== CONVERTED) return <span className="text-xs font-bold text-[#587063]">Not converted</span>; if (id && customer) return <Link href={`/admin/customers/${customer.id}`} className="text-xs font-black text-[#1f7a3f] underline underline-offset-4">Open customer {customer.name}</Link>; if (id) return <span className="text-xs font-bold text-[#7a4a00]">Customer link recorded; customer unavailable</span>; return <span className="text-xs font-bold text-[#7a4a00]">Marked converted; no customer link stored</span>; }

function RequestRow({request, customer}: {request: RequestRow; customer?: {id: string; name: string}}) {
  return <tr className="border-t border-[#102015]/10 align-top"><td className="whitespace-nowrap px-4 py-4 text-[#405348]">{formatDate(request.createdAt)}</td><td className="px-4 py-4"><p className="font-black text-[#102015]">{request.contactName || request.phone || "Unknown applicant"}</p><p className="mt-1 text-xs text-[#587063]">{request.email || "No email"}{request.phone ? ` · ${request.phone}` : " · No phone"}</p><p className="mt-1 text-xs text-[#405348]">{request.location || "No location"}</p></td><td className="px-4 py-4"><p className="font-bold text-[#102015]">{request.organisationName || "No organisation provided"}</p><p className="mt-1 text-xs text-[#587063]">{request.buyerType} · {request.source}</p>{request.message ? <p className="mt-2 max-w-xs text-xs text-[#405348]">{preview(request.message)}</p> : null}</td><td className="px-4 py-4"><AdminStatusPill tone={adminToneFromStatus(request.status)}>{request.status}</AdminStatusPill></td><td className="max-w-48 px-4 py-4"><ConversionState request={request} customer={customer} /></td><td className="px-4 py-4"><ReviewApplication request={request} customer={customer} /></td></tr>;
}

function RequestCard({request, customer}: {request: RequestRow; customer?: {id: string; name: string}}) {
  return <article className="rounded-2xl border border-[#102015]/10 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-[#102015]">{request.organisationName || request.contactName || "Unknown applicant"}</h2><p className="mt-1 text-xs text-[#587063]">{request.contactName} · {formatDate(request.createdAt)}</p></div><AdminStatusPill tone={adminToneFromStatus(request.status)}>{request.status}</AdminStatusPill></div><p className="mt-3 text-xs font-bold text-[#587063]">{request.buyerType} · {request.phone || request.email || "No contact detail"}</p><div className="mt-3"><ConversionState request={request} customer={customer} /></div><div className="mt-4"><ReviewApplication request={request} customer={customer} /></div></article>;
}

function ReviewApplication({request, customer}: {request: RequestRow; customer?: {id: string; name: string}}) {
  const converted = request.status === CONVERTED;
  return <details className="min-w-44"><summary className="cursor-pointer rounded-xl border border-[#102015]/15 px-3 py-2 text-center text-xs font-black text-[#102015] focus:outline-none focus:ring-2 focus:ring-[#1f7a3f]">Review {request.contactName || "application"}</summary><div className="mt-2 min-w-72 rounded-xl bg-[#f7f5ec] p-3 text-sm"><div className="grid gap-1 leading-6 text-[#405348]"><Detail label="Applicant" value={request.contactName} /><Detail label="Organisation" value={request.organisationName} /><Detail label="Email" value={request.email} /><Detail label="Phone" value={request.phone} /><Detail label="Location" value={request.location} /><Detail label="Buyer type" value={request.buyerType} /><Detail label="Registration" value={request.businessRegNumber} /><Detail label="Produce needs" value={request.usualProduceNeeds} /><Detail label="Order frequency" value={request.orderFrequency} /><Detail label="Estimated spend" value={request.estimatedSpend} /><Detail label="Payment preference" value={request.preferredPaymentMethod} /><Detail label="Receipts" value={request.needsReceipts ? "Required" : "Not requested"} /><Detail label="Credit interest" value={request.interestedInCredit ? "Interested" : "No"} /><Detail label="Source" value={request.source} /><Detail label="Status" value={request.status} /><Detail label="Submitted" value={formatDate(request.createdAt)} /><Detail label="Updated" value={formatDate(request.updatedAt)} />{request.message ? <p className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap"><strong className="text-[#102015]">Message:</strong> {request.message}</p> : null}</div><div className="mt-3"><ConversionState request={request} customer={customer} /></div>{!converted ? <div className="mt-3 grid gap-2"><form action={updateBuyerAccountRequestStatusAction} className="grid gap-2"><input type="hidden" name="requestId" value={request.id} /><label className="grid gap-1 text-xs font-black text-[#405348]">Application status<select name="status" defaultValue={request.status} className="rounded-lg border border-[#102015]/15 bg-white px-2 py-2 text-sm font-normal">{[...new Set([request.status, ...reviewStatuses])].map((item) => <option key={item}>{item}</option>)}</select></label><button className="rounded-lg bg-[#102015] px-3 py-2 text-xs font-black text-white">Update status</button></form><form action={convertBuyerAccountRequestToCustomerAction}><input type="hidden" name="requestId" value={request.id} /><button className="w-full rounded-lg bg-[#1f7a3f] px-3 py-2 text-xs font-black text-white">Convert to customer</button></form><p className="text-xs leading-5 text-[#587063]">Conversion creates the customer only. Configure login access separately.</p></div> : null}</div></details>;
}

function Detail({label, value}: {label: string; value: string | null | undefined}) { return <p><strong className="text-[#102015]">{label}:</strong> {value || "Not provided"}</p>; }
