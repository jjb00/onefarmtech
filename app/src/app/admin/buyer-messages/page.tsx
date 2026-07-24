import Link from "next/link";
import {redirect} from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";
import CommunicationsViewSwitcher from "@/components/admin/CommunicationsViewSwitcher";
import {AdminEmptyState, AdminListToolbar, AdminPagination, AdminResultCount} from "@/components/admin/AdminListControls";
import {AdminStatusPill, adminToneFromStatus} from "@/components/admin/AdminViewControls";
import BuyerWhatsAppComposeButton from "@/components/admin/BuyerWhatsAppComposeButton";
import {retryFailedEmailAction} from "@/actions/communications";
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
      {staff.role !== "Finance" ? <div className="flex flex-wrap gap-2 text-sm font-bold">
        <Link href="/admin/orders?view=new-requests" className="rounded-lg border bg-white px-3 py-2">New requests</Link>
        <Link href="/admin/customers?view=applications" className="rounded-lg border bg-white px-3 py-2">Account requests</Link>
      </div> : null}
      {view === "needs-reply" ? <WhatsAppView raw={raw || {}} mode="needs-reply" canDelete={staff.role === "Super admin"} /> : null}
      {view === "all" ? <WhatsAppView raw={raw || {}} mode="all" canDelete={staff.role === "Super admin"} /> : null}
      {view === "whatsapp" ? <WhatsAppView raw={raw || {}} mode="known" canDelete={staff.role === "Super admin"} /> : null}
      {view === "enquiries" ? <OperationalUnknownWhatsAppView raw={raw || {}} canDelete={staff.role === "Super admin"} /> : null}
      {view === "failed" ? <WhatsAppView raw={raw || {}} mode="failed" canDelete={staff.role === "Super admin"} /> : null}
      {view === "email" ? <EmailView raw={raw || {}} /> : null}
      {view === "operations" ? <OperationalEventsView raw={raw || {}} /> : null}
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

async function EmailView({raw}: {raw: Params}) {
  const q = value(raw.q), pageSize = parseAdminPageSize(value(raw.pageSize)), page = parseAdminPage(value(raw.page));
  const where = {status: {in: ["Failed", "Bounced", "Complained"]}, relatedType: {in: ["Order", "PaymentRequest", "Delivery", "Receipt"]}, ...(q ? {OR: [{recipient: {contains: q, mode: "insensitive" as const}}, {subject: {contains: q, mode: "insensitive" as const}}, {template: {contains: q, mode: "insensitive" as const}}, {relatedId: {contains: q, mode: "insensitive" as const}}]} : {})};
  const total = await prisma.emailDelivery.count({where});
  const pages = Math.max(1, Math.ceil(total / pageSize)), base = {view: "email", q, pageSize};
  if (page > pages) redirect(adminListHref(PATH, base, {page: pages}));
  const deliveries = await prisma.emailDelivery.findMany({where, orderBy: [{createdAt: "desc"}, {id: "desc"}], skip: (page - 1) * pageSize, take: pageSize});
  const range = adminResultRange(page, pageSize, total);
  return <SourceList toolbar={<AdminListToolbar search={q} pageSize={pageSize} resetHref={`${PATH}?view=email`} hiddenParams={{view: "email"}} searchLabel="Search failed operational notifications" searchPlaceholder="Recipient, subject, template or related ID" filters={[]} />} range={range} total={total} label="failed operational notifications" page={page} pages={pages} base={base} empty="No failed operational notifications."><div className="grid gap-3">{deliveries.map((delivery) => <article key={delivery.id} className="rounded-2xl border bg-white p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{delivery.recipient}</p><p className="text-sm text-[#405348]">{delivery.subject}</p><p className="text-xs text-[#587063]">{delivery.template} · attempt {formatDate(delivery.lastAttemptAt || delivery.createdAt)}</p></div><AdminStatusPill tone={adminToneFromStatus(delivery.status)}>{delivery.status}</AdminStatusPill></div><details className="mt-3"><summary className="cursor-pointer text-sm font-black">Review</summary><p className="mt-2 text-sm">{delivery.lastError || delivery.latestEventType || "No failure detail recorded."}</p><p className="mt-2 text-xs text-[#587063]">Attempts: {delivery.retryCount} · Related: {delivery.relatedType || "None"} {delivery.relatedId || ""}</p>{delivery.status === "Failed" ? <form action={retryFailedEmailAction} className="mt-3"><input type="hidden" name="deliveryId" value={delivery.id}/><button className="rounded-lg bg-[#1f7a3f] px-3 py-2 text-sm font-black text-white">Retry email</button></form> : null}</details></article>)}</div></SourceList>;
}

async function OperationalEventsView({raw}: {raw: Params}) {
  const q = value(raw.q), status = value(raw.status) || "Open", category = value(raw.category), severity = value(raw.severity), relatedType = value(raw.relatedType), pageSize = parseAdminPageSize(value(raw.pageSize)), page = parseAdminPage(value(raw.page));
  const where = {...(status ? {status} : {}), ...(category ? {category} : {}), ...(severity ? {severity} : {}), ...(relatedType ? {relatedType} : {}), ...(q ? {OR: [{category: {contains: q, mode: "insensitive" as const}}, {summary: {contains: q, mode: "insensitive" as const}}, {route: {contains: q, mode: "insensitive" as const}}, {relatedType: {contains: q, mode: "insensitive" as const}}, {relatedId: {contains: q, mode: "insensitive" as const}}]} : {})};
  const [total, statuses, categories, severities, relatedTypes] = await Promise.all([
    prisma.operationalEvent.count({where}),
    prisma.operationalEvent.findMany({distinct: ["status"], select: {status: true}, orderBy: {status: "asc"}}),
    prisma.operationalEvent.findMany({distinct: ["category"], select: {category: true}, orderBy: {category: "asc"}}),
    prisma.operationalEvent.findMany({distinct: ["severity"], select: {severity: true}, orderBy: {severity: "asc"}}),
    prisma.operationalEvent.findMany({where: {relatedType: {not: null}}, distinct: ["relatedType"], select: {relatedType: true}, orderBy: {relatedType: "asc"}}),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize)), base = {view: "operations", q, status, category, severity, relatedType, pageSize};
  if (page > pages) redirect(adminListHref(PATH, base, {page: pages}));
  const events = await prisma.operationalEvent.findMany({where, orderBy: [{createdAt: "desc"}, {id: "desc"}], skip: (page - 1) * pageSize, take: pageSize});
  const range = adminResultRange(page, pageSize, total);
  const toolbar = <AdminListToolbar search={q} pageSize={pageSize} resetHref={`${PATH}?view=operations`} hiddenParams={{view: "operations"}} searchLabel="Search operational events" searchPlaceholder="Category, summary, route or related record" filters={[
    {name: "status", label: "Status", value: status, options: statuses.map((x) => ({value: x.status, label: x.status}))},
    {name: "category", label: "Type / source", value: category, options: categories.map((x) => ({value: x.category, label: x.category}))},
    {name: "severity", label: "Severity", value: severity, options: severities.map((x) => ({value: x.severity, label: x.severity}))},
    {name: "relatedType", label: "Related record", value: relatedType, options: relatedTypes.flatMap((x) => x.relatedType ? [{value: x.relatedType, label: x.relatedType}] : [])},
  ]}/>;
  return <SourceList toolbar={toolbar} range={range} total={total} label="events" page={page} pages={pages} base={base} empty="No matching operational events.">
    <section className="hidden overflow-hidden rounded-2xl border border-[#102015]/10 bg-white md:block"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#f3f8ef] text-xs uppercase tracking-[0.12em] text-[#405348]"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Type / source</th><th className="px-4 py-3">Summary</th><th className="px-4 py-3">State</th><th className="px-4 py-3">Review</th></tr></thead><tbody>{events.map((event) => <OperationalEventRow key={event.id} event={event}/>)}</tbody></table></section>
    <section className="grid gap-3 md:hidden">{events.map((event) => <OperationalEventCard key={event.id} event={event}/>)}</section>
  </SourceList>;
}

type OperationalEventItem = {id: string; category: string; severity: string; summary: string; route: string | null; relatedType: string | null; relatedId: string | null; status: string; createdAt: Date};
function OperationalEventReview({event}: {event: OperationalEventItem}) {
  const href = relatedHref(event.relatedType, event.relatedId);
  return <details><summary className="cursor-pointer rounded-lg border px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#1f7a3f]">Review</summary><div className="mt-2 min-w-64 rounded-xl bg-[#f7f5ec] p-3"><p className="whitespace-pre-wrap text-sm">{event.summary}</p><p className="mt-2 text-xs text-[#587063]">Route/source: {event.route || "Internal operation"}</p>{event.relatedType ? <p className="mt-1 text-xs text-[#587063]">Related: {event.relatedType} · {event.relatedId || "No identifier"}</p> : null}{href ? <Link href={href} className="mt-3 inline-flex text-sm font-black text-[#1f7a3f]">Open related {event.relatedType}</Link> : null}</div></details>;
}
function OperationalEventRow({event}: {event: OperationalEventItem}) { return <tr className="border-t align-top"><td className="whitespace-nowrap px-4 py-4 text-[#587063]">{formatDate(event.createdAt)}</td><td className="px-4 py-4"><p className="font-black">{event.category}</p><p className="text-xs text-[#587063]">{event.route || "Internal"}</p></td><td className="max-w-md px-4 py-4">{preview(event.summary)}</td><td className="px-4 py-4"><AdminStatusPill tone={adminToneFromStatus(event.severity)}>{event.severity}</AdminStatusPill><p className="mt-2 text-xs font-bold">{event.status}</p></td><td className="px-4 py-4"><OperationalEventReview event={event}/></td></tr>; }
function OperationalEventCard({event}: {event: OperationalEventItem}) { return <article className="rounded-2xl border bg-white p-4"><div className="flex justify-between gap-3"><div><h2 className="font-black">{event.category}</h2><p className="text-xs text-[#587063]">{formatDate(event.createdAt)}</p></div><AdminStatusPill tone={adminToneFromStatus(event.severity)}>{event.severity}</AdminStatusPill></div><p className="mt-3 text-sm">{preview(event.summary)}</p><p className="mt-2 text-xs font-bold text-[#587063]">{event.status} · {event.route || "Internal operation"}</p><div className="mt-3"><OperationalEventReview event={event}/></div></article>; }

function SourceList({toolbar, range, total, label, page, pages, base, empty, children}: {toolbar: React.ReactNode; range: {start: number; end: number}; total: number; label: string; page: number; pages: number; base: Record<string, unknown>; empty: string; children: React.ReactNode}) {
  return <div className="grid gap-4">{toolbar}<AdminResultCount {...range} total={total} label={label}/>{total ? children : <AdminEmptyState title={empty} description="Try a different search term or clear one or more filters." resetHref={adminListHref(PATH, {view: base.view})}/>}<AdminPagination page={page} totalPages={pages} previousHref={page > 1 ? adminListHref(PATH, base, {page: page - 1}) : undefined} nextHref={page < pages ? adminListHref(PATH, base, {page: page + 1}) : undefined}/></div>;
}
