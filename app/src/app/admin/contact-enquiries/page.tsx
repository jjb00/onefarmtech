import {redirect} from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";
import {AdminEmptyState, AdminListToolbar, AdminPagination, AdminResultCount} from "@/components/admin/AdminListControls";
import {AdminStatusPill, adminToneFromStatus} from "@/components/admin/AdminViewControls";
import {updateContactEnquiryStatusAction} from "@/actions/createAdminRecords";
import {prisma} from "@/lib/prisma";
import {adminListHref, adminResultRange, parseAdminPage, parseAdminPageSize} from "@/lib/adminListParams.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {searchParams?: Promise<Record<string, string | string[] | undefined>>};
const PATH = "/admin/contact-enquiries";
const managementStatuses = ["Reviewing", "Followed up", "Closed", "Rejected"];

function text(value: string | string[] | undefined) { return String(Array.isArray(value) ? value[0] : value || "").trim(); }
function formatDate(value: Date) { return new Intl.DateTimeFormat("en-GB", {dateStyle: "medium", timeStyle: "short"}).format(value); }
function preview(value: string) { return value.length > 140 ? `${value.slice(0, 137).trimEnd()}…` : value; }

export default async function ContactEnquiriesPage({searchParams}: PageProps) {
  const raw = await searchParams;
  const q = text(raw?.q);
  const status = text(raw?.status);
  const enquiryType = text(raw?.type);
  const source = text(raw?.source);
  const pageSize = parseAdminPageSize(text(raw?.pageSize));
  const page = parseAdminPage(text(raw?.page));
  const params = {q, status, type: enquiryType, source, pageSize};
  const where = {
    ...(q ? {OR: ["name", "email", "phone", "organisation", "message"].map((field) => ({[field]: {contains: q, mode: "insensitive" as const}}))} : {}),
    ...(status ? {status} : {}),
    ...(enquiryType ? {enquiryType} : {}),
    ...(source ? {source} : {}),
  };

  const [total, allTotal, statusValues, typeValues, sourceValues] = await Promise.all([
    prisma.contactEnquiry.count({where}),
    prisma.contactEnquiry.count(),
    prisma.contactEnquiry.findMany({distinct: ["status"], select: {status: true}, orderBy: {status: "asc"}}),
    prisma.contactEnquiry.findMany({distinct: ["enquiryType"], select: {enquiryType: true}, orderBy: {enquiryType: "asc"}}),
    prisma.contactEnquiry.findMany({distinct: ["source"], select: {source: true}, orderBy: {source: "asc"}}),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) redirect(adminListHref(PATH, params, {page: totalPages}));

  const enquiries = await prisma.contactEnquiry.findMany({where, orderBy: [{createdAt: "desc"}, {id: "desc"}], skip: (page - 1) * pageSize, take: pageSize});
  const range = adminResultRange(page, pageSize, total);
  const filtered = Boolean(q || status || enquiryType || source);

  return <AdminPageShell title="Contact enquiries" description="Review public enquiries and unmatched WhatsApp contacts." actionHref="/admin/buyer-messages?view=enquiries" actionLabel="Open unified Inbox" compactHeader>
    <div className="grid gap-5">
      <AdminListToolbar search={q} pageSize={pageSize} resetHref={PATH} filters={[
        {name: "status", label: "Status", value: status, options: statusValues.map(({status: value}) => ({value, label: value}))},
        {name: "type", label: "Enquiry type", value: enquiryType, options: typeValues.map(({enquiryType: value}) => ({value, label: value}))},
        {name: "source", label: "Source", value: source, options: sourceValues.map(({source: value}) => ({value, label: value}))},
      ]} />
      <div className="flex flex-wrap items-center justify-between gap-3"><AdminResultCount {...range} total={total} label="enquiries" /><p className="text-xs font-bold text-[#587063]">{allTotal.toLocaleString()} total records</p></div>

      {!enquiries.length ? <AdminEmptyState title={allTotal === 0 ? "No enquiries yet" : "No matching enquiries"} description={allTotal === 0 ? "New contact and unmatched WhatsApp enquiries will appear here." : "Try a different search term or clear one or more filters."} resetHref={filtered ? PATH : undefined} /> : <>
        <section className="hidden overflow-hidden rounded-2xl border border-[#102015]/10 bg-white shadow-sm md:block"><div className="overflow-x-auto"><table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-[#f3f8ef] text-xs uppercase tracking-[0.12em] text-[#405348]"><tr><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Type / source</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Review</th></tr></thead>
          <tbody>{enquiries.map((enquiry) => <tr key={enquiry.id} className="border-t border-[#102015]/10 align-top"><td className="whitespace-nowrap px-4 py-4 text-[#405348]">{formatDate(enquiry.createdAt)}</td><td className="px-4 py-4"><p className="font-black text-[#102015]">{enquiry.name}</p><p className="mt-1 text-xs leading-5 text-[#587063]">{enquiry.email || "No email"}{enquiry.phone ? ` · ${enquiry.phone}` : ""}</p><p className="mt-1 text-xs text-[#405348]">{enquiry.organisation || "No organisation"}</p></td><td className="px-4 py-4"><p className="font-bold text-[#102015]">{enquiry.enquiryType}</p><p className="mt-1 text-xs text-[#587063]">{enquiry.source}</p></td><td className="max-w-sm px-4 py-4 leading-6 text-[#405348]">{preview(enquiry.message)}</td><td className="px-4 py-4"><AdminStatusPill tone={adminToneFromStatus(enquiry.status)}>{enquiry.status}</AdminStatusPill></td><td className="px-4 py-4"><EnquiryReview enquiry={enquiry} /></td></tr>)}</tbody>
        </table></div></section>
        <section className="grid gap-3 md:hidden">{enquiries.map((enquiry) => <article key={enquiry.id} className="rounded-2xl border border-[#102015]/10 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-[#102015]">{enquiry.name}</h2><p className="mt-1 text-xs text-[#587063]">{formatDate(enquiry.createdAt)}</p></div><AdminStatusPill tone={adminToneFromStatus(enquiry.status)}>{enquiry.status}</AdminStatusPill></div><p className="mt-3 text-sm font-bold text-[#102015]">{enquiry.enquiryType}</p><p className="mt-1 text-xs text-[#587063]">{enquiry.source} · {enquiry.email || enquiry.phone || "No contact detail"}</p><p className="mt-3 text-sm leading-6 text-[#405348]">{preview(enquiry.message)}</p><div className="mt-4"><EnquiryReview enquiry={enquiry} /></div></article>)}</section>
      </>}
      <AdminPagination page={page} totalPages={totalPages} previousHref={page > 1 ? adminListHref(PATH, params, {page: page - 1}) : undefined} nextHref={page < totalPages ? adminListHref(PATH, params, {page: page + 1}) : undefined} />
    </div>
  </AdminPageShell>;
}

function EnquiryReview({enquiry}: {enquiry: {id: string; message: string; status: string; adminNote: string | null}}) {
  return <details className="min-w-40"><summary className="cursor-pointer rounded-xl border border-[#102015]/15 px-3 py-2 text-center text-xs font-black text-[#102015] focus:outline-none focus:ring-2 focus:ring-[#1f7a3f]">Manage</summary><div className="mt-2 min-w-64 rounded-xl bg-[#f7f5ec] p-3"><p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-[#405348]">{enquiry.message}</p>{enquiry.adminNote ? <p className="mt-2 border-t border-[#102015]/10 pt-2 text-xs text-[#587063]">Admin note recorded</p> : null}<form action={updateContactEnquiryStatusAction} className="mt-3 grid gap-2"><input type="hidden" name="enquiryId" value={enquiry.id} /><label className="grid gap-1 text-xs font-black text-[#405348]">Status<select name="status" defaultValue={enquiry.status} className="rounded-lg border border-[#102015]/15 bg-white px-2 py-2 text-sm font-normal">{[...new Set([enquiry.status, ...managementStatuses])].map((value) => <option key={value}>{value}</option>)}</select></label><button className="rounded-lg bg-[#1f7a3f] px-3 py-2 text-xs font-black text-white">Update status</button></form></div></details>;
}
