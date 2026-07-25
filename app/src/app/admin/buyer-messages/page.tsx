import Link from "next/link";
import {redirect} from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";
import CommunicationsViewSwitcher from "@/components/admin/CommunicationsViewSwitcher";
import {AdminEmptyState, AdminListToolbar, AdminPagination, AdminResultCount} from "@/components/admin/AdminListControls";
import {AdminStatusPill, adminToneFromStatus} from "@/components/admin/AdminViewControls";
import BuyerWhatsAppComposeButton from "@/components/admin/BuyerWhatsAppComposeButton";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {adminListHref, adminResultRange, parseAdminPage, parseAdminPageSize} from "@/lib/adminListParams.js";
import {resolveCommunicationView, resolveCommunicationViewForRole} from "@/lib/communicationsWorkspace.js";
import {isOperationalUnknownWhatsAppContact, nonOperationalWhatsAppPhrases} from "@/lib/whatsappClassification.js";
import AdminRecordControls from "@/components/admin/AdminRecordControls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const PATH = "/admin/buyer-messages";
type Params = Record<string, string | string[] | undefined>;

function value(raw: string | string[] | undefined) { return String(Array.isArray(raw) ? raw[0] : raw || "").trim(); }
function formatDate(raw: Date | string | null) { return raw ? new Intl.DateTimeFormat("en-GB", {dateStyle: "medium", timeStyle: "short"}).format(new Date(raw)) : "Not recorded"; }
function preview(raw: string, length = 120) { return raw.length > length ? `${raw.slice(0, length - 1).trimEnd()}…` : raw; }
function relatedHref(type?: string | null, id?: string | null) {
  if (!id) return null;
  if (type === "Order") return `/admin/orders/${id}`;
  if (type === "Customer") return `/admin/customers/${id}`;
  if (type === "PaymentRequest") return "/admin/payment-requests";
  return null;
}

export default async function AdminBuyerMessagesPage({searchParams}: {searchParams?: Promise<Params>}) {
  const staff = await requireStaff();
  const raw = await searchParams;
  const requestedView = value(raw?.view);
  const normalizedView = resolveCommunicationView(requestedView);
  const view = resolveCommunicationViewForRole(requestedView, staff.role);
  if (!view) redirect("/admin?access=denied&blocked=/admin/buyer-messages");
  if ((requestedView && requestedView !== normalizedView) || normalizedView !== view) redirect(`${PATH}?view=${view}`);
  const params = {q: value(raw?.q), status: value(raw?.status), direction: value(raw?.direction), type: value(raw?.type), source: value(raw?.source), pageSize: parseAdminPageSize(value(raw?.pageSize))};

  return <AdminPageShell title="Inbox" description="Operational buyer conversations, unmatched WhatsApp contacts and follow-up evidence." compactHeader>
    <div className="grid gap-5">
      <CommunicationsViewSwitcher activeView={view} params={params} role={staff.role} />
      {view === "needs-reply" ? <WhatsAppView raw={raw || {}} mode="needs-reply" canDelete={staff.role === "Super admin"} /> : null}
      {view === "all" ? <WhatsAppView raw={raw || {}} mode="all" canDelete={staff.role === "Super admin"} /> : null}
      {view === "whatsapp" ? <WhatsAppView raw={raw || {}} mode="known" canDelete={staff.role === "Super admin"} /> : null}
      {view === "enquiries" ? <OperationalUnknownWhatsAppView raw={raw || {}} canDelete={staff.role === "Super admin"} /> : null}
      {view === "failed" ? <WhatsAppView raw={raw || {}} mode="failed" canDelete={staff.role === "Super admin"} /> : null}
    </div>
  </AdminPageShell>;
}

async function OperationalUnknownWhatsAppView({raw, canDelete}: {raw: Params; canDelete: boolean}) {
  const q = value(raw.q), page = parseAdminPage(value(raw.page)), pageSize = parseAdminPageSize(value(raw.pageSize));
  const where = {
    enquiryType: "WhatsApp inbound",
    status: {in: ["New", "Open"]},
    OR: [
      {adminNote: {contains: "classification: operational", mode: "insensitive" as const}},
      {AND: nonOperationalWhatsAppPhrases.map((phrase) => ({message: {not: {contains: phrase, mode: "insensitive" as const}}}))},
    ],
    ...(q ? {AND: [{OR: [{name: {contains: q, mode: "insensitive" as const}}, {phone: {contains: q}}, {message: {contains: q, mode: "insensitive" as const}}]}]} : {}),
  };
  const total = await prisma.contactEnquiry.count({where});
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = {view: "enquiries", q, pageSize};
  if (page > pages) redirect(adminListHref(PATH, base, {page: pages}));
  const contacts = await prisma.contactEnquiry.findMany({
    where,
    orderBy: [{updatedAt: "desc"}, {id: "desc"}],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const range = adminResultRange(page, pageSize, total);
  return <div className="grid gap-4">
    <AdminListToolbar search={q} filters={[]} pageSize={pageSize} resetHref={`${PATH}?view=enquiries`} hiddenParams={{view: "enquiries"}} searchLabel="Search unknown contacts" searchPlaceholder="Name, phone or message" />
    <AdminResultCount {...range} total={total} label="unknown order contacts" />
    {contacts.length ? (
    <div className="grid gap-3">
      {contacts.map((contact) => (
        <article key={contact.id} className="rounded-2xl border bg-white p-4">
          <div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{contact.name || contact.phone || "Unknown contact"}</p><p className="text-xs text-[#587063]">{contact.phone || "No phone recorded"}</p></div><AdminStatusPill tone={adminToneFromStatus(contact.status)}>{contact.status}</AdminStatusPill></div>
          <p className="mt-3 text-sm text-[#405348]">{preview(contact.message)}</p>
          <Link href={`/admin/contact-enquiries?focus=${contact.id}`} className="mt-3 inline-flex min-h-11 items-center font-black text-[#1f7a3f]">Review contact</Link>
          <AdminRecordControls recordType="ContactEnquiry" recordId={contact.id} canDelete={canDelete}/>
        </article>
      ))}
    </div>
  ) : <AdminEmptyState title="No unknown order contacts." description="Recruitment, supplier and general messages are excluded from this operational queue." resetHref={`${PATH}?view=enquiries`} />}
  <AdminPagination page={page} totalPages={pages} previousHref={page > 1 ? adminListHref(PATH, base, {page: page - 1}) : undefined} nextHref={page < pages ? adminListHref(PATH, base, {page: page + 1}) : undefined} />
  </div>;
}

async function WhatsAppView({raw, mode, canDelete}: {raw: Params; mode: "needs-reply" | "known" | "failed" | "all"; canDelete: boolean}) {
  const q = value(raw.q), direction = value(raw.direction), status = value(raw.status), pageSize = parseAdminPageSize(value(raw.pageSize)), page = parseAdminPage(value(raw.page));
  const where = {channel: "WhatsApp", ...(mode === "needs-reply" ? {direction: "Inbound", status: {notIn: ["Replied", "Closed", "Resolved", "Archived"]}} : mode === "failed" ? {direction: "Outbound", status: "Failed"} : {status: {not: "Archived"}}), ...(direction ? {direction} : {}), ...(status ? {status} : {}), ...(q ? {OR: [{title: {contains: q, mode: "insensitive" as const}}, {body: {contains: q, mode: "insensitive" as const}}, {recipient: {contains: q, mode: "insensitive" as const}}, {customer: {name: {contains: q, mode: "insensitive" as const}}}]} : {})};
  const [total, unknownCandidates, statuses] = await Promise.all([prisma.buyerMessage.count({where}), prisma.contactEnquiry.findMany({where: {enquiryType: "WhatsApp inbound", status: {in: ["New", "Open"]}}, select: {source: true, enquiryType: true, message: true, adminNote: true}, take: 100}), prisma.buyerMessage.findMany({where: {channel: "WhatsApp"}, distinct: ["status"], select: {status: true}, orderBy: {status: "asc"}})]);
  const unknownCount = unknownCandidates.filter(isOperationalUnknownWhatsAppContact).length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const viewName = mode === "known" ? "whatsapp" : mode;
  const base = {view: viewName, q, direction, status, pageSize};
  if (page > totalPages) redirect(adminListHref(PATH, base, {page: totalPages}));
  const messages = await prisma.buyerMessage.findMany({where, orderBy: [{createdAt: "desc"}, {id: "desc"}], skip: (page - 1) * pageSize, take: pageSize, include: {customer: {select: {id: true, name: true, phone: true}}}});
  const range = adminResultRange(page, pageSize, total);
  return <SourceList toolbar={<AdminListToolbar search={q} pageSize={pageSize} resetHref={`${PATH}?view=${viewName}`} hiddenParams={{view: viewName}} searchLabel="Search WhatsApp" searchPlaceholder="Buyer, recipient or message" filters={[{name: "direction", label: "Direction", value: direction, options: ["Inbound", "Outbound"].map((x) => ({value: x, label: x}))}, {name: "status", label: "Status", value: status, options: statuses.map((x) => ({value: x.status, label: x.status}))}]} />} range={range} total={total} label="messages" page={page} pages={totalPages} base={base} empty="No matching WhatsApp messages.">
    {unknownCount ? <Link href={`${PATH}?view=enquiries&type=WhatsApp+inbound`} className="block rounded-xl bg-[#fff6d6] px-4 py-3 text-sm font-bold text-[#6b4b00]">{unknownCount} unmatched WhatsApp contact{unknownCount === 1 ? "" : "s"} available in Enquiries</Link> : null}
    <div className="grid gap-3">{messages.map((message) => <article key={message.id} className="rounded-2xl border bg-white p-4"><div className="flex flex-wrap justify-between gap-3"><div><div className="flex gap-2"><AdminStatusPill tone={adminToneFromStatus(message.status)}>{message.status}</AdminStatusPill><span className="text-xs font-black uppercase text-[#587063]">{message.direction}</span></div><Link href={`/admin/customers/${message.customerId}`} className="mt-2 block font-black text-[#1f7a3f]">{message.customer.name}</Link><p className="text-xs text-[#587063]">{message.recipient || message.customer.phone || "No recipient"}</p></div><p className="text-xs text-[#587063]">{formatDate(message.createdAt)}</p></div><p className="mt-3 font-bold">{message.title}</p><p className="mt-1 text-sm text-[#405348]">{preview(message.body)}</p><details className="mt-3"><summary className="cursor-pointer text-sm font-black">Review</summary><p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p><div className="mt-3 flex flex-wrap gap-2">{relatedHref(message.relatedType, message.relatedId) ? <Link href={relatedHref(message.relatedType, message.relatedId)!} className="text-sm font-black text-[#1f7a3f]">Open related {message.relatedType}</Link> : null}{message.customer.phone ? <BuyerWhatsAppComposeButton customerId={message.customerId} phone={message.customer.phone} title={message.title} body={message.body} relatedType="BuyerMessage" relatedId={message.id} /> : null}</div><p className="mt-2 text-xs text-[#587063]">Source: {message.source || "Message log"}</p><AdminRecordControls recordType="BuyerMessage" recordId={message.id} canDelete={canDelete}/></details></article>)}</div>
  </SourceList>;
}



function SourceList({toolbar, range, total, label, page, pages, base, empty, children}: {toolbar: React.ReactNode; range: {start: number; end: number}; total: number; label: string; page: number; pages: number; base: Record<string, unknown>; empty: string; children: React.ReactNode}) {
  return <div className="grid gap-4">{toolbar}<AdminResultCount {...range} total={total} label={label}/>{total ? children : <AdminEmptyState title={empty} description="Try a different search term or clear one or more filters." resetHref={adminListHref(PATH, {view: base.view})}/>}<AdminPagination page={page} totalPages={pages} previousHref={page > 1 ? adminListHref(PATH, base, {page: page - 1}) : undefined} nextHref={page < pages ? adminListHref(PATH, base, {page: page + 1}) : undefined}/></div>;
}
