import Link from "next/link";
import {redirect} from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";
import CommunicationsViewSwitcher from "@/components/admin/CommunicationsViewSwitcher";
import {AdminEmptyState, AdminListToolbar, AdminPagination, AdminResultCount} from "@/components/admin/AdminListControls";
import {AdminStatusPill, adminToneFromStatus} from "@/components/admin/AdminViewControls";
import BuyerWhatsAppComposeButton from "@/components/admin/BuyerWhatsAppComposeButton";
import ContactEnquiriesList from "@/components/admin/ContactEnquiriesList";
import {resolvePaymentIncidentAction, retryFailedEmailAction} from "@/actions/communications";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {adminListHref, adminResultRange, parseAdminPage, parseAdminPageSize} from "@/lib/adminListParams.js";
import {resolveCommunicationView, resolveCommunicationViewForRole} from "@/lib/communicationsWorkspace.js";

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
        <Link href="/admin/order-requests" className="rounded-lg border bg-white px-3 py-2">Order requests</Link>
        <Link href="/admin/buyer-account-requests" className="rounded-lg border bg-white px-3 py-2">Buyer requests</Link>
        <Link href="/admin/whatsapp-tools" className="rounded-lg border bg-white px-3 py-2">WhatsApp tools</Link>
        <Link href="/admin/customers" className="rounded-lg border bg-white px-3 py-2">All buyers</Link>
      </div> : null}
      {view === "all" ? <AllActivity /> : null}
      {view === "whatsapp" ? <WhatsAppView raw={raw || {}} /> : null}
      {view === "enquiries" ? <ContactEnquiriesList raw={{...(raw || {}), type: "WhatsApp inbound"}} pathname={PATH} hiddenParams={{view: "enquiries", type: "WhatsApp inbound"}} /> : null}
      {view === "email" ? <EmailView raw={raw || {}} /> : null}
      {view === "reconciliation" ? <ReconciliationView raw={raw || {}} canResolve={["Super admin", "Admin", "Finance"].includes(staff.role)} /> : null}
      {view === "operations" ? <OperationalEventsView raw={raw || {}} /> : null}
    </div>
  </AdminPageShell>;
}

async function AllActivity() {
  const [messages, unmatchedWhatsApp, buyerRequests, orderRequests, emails, incidents, operationalEvents, unknownCount] = await Promise.all([
    prisma.buyerMessage.findMany({orderBy: [{createdAt: "desc"}, {id: "desc"}], take: 8, include: {customer: {select: {id: true, name: true}}}}),
    prisma.contactEnquiry.findMany({where: {enquiryType: "WhatsApp inbound"}, orderBy: [{createdAt: "desc"}, {id: "desc"}], take: 8}),
    prisma.buyerAccountRequest.findMany({where: {status: {in: ["New", "Reviewing"]}}, orderBy: [{createdAt: "desc"}, {id: "desc"}], take: 8}),
    prisma.orderRequest.findMany({where: {status: {in: ["New", "Reviewing"]}}, orderBy: [{createdAt: "desc"}, {id: "desc"}], take: 8}),
    prisma.emailDelivery.findMany({orderBy: [{createdAt: "desc"}, {id: "desc"}], take: 8}),
    prisma.paymentReconciliationIncident.findMany({where: {status: {in: ["Open", "Investigating"]}}, orderBy: [{createdAt: "desc"}, {id: "desc"}], take: 8}),
    prisma.operationalEvent.findMany({where: {status: "Open"}, orderBy: [{createdAt: "desc"}, {id: "desc"}], take: 8}),
    prisma.contactEnquiry.count({where: {enquiryType: "WhatsApp inbound"}}),
  ]);
  const sections = [
    {title: "Buyer messages", href: `${PATH}?view=whatsapp`, items: messages.map((x) => ({id: x.id, title: `${x.customer.name} · ${x.channel} · ${x.direction}`, detail: preview(x.title), date: x.createdAt}))},
    {title: `Unknown WhatsApp${unknownCount ? ` · ${unknownCount}` : ""}`, href: `${PATH}?view=enquiries&type=WhatsApp+inbound`, items: unmatchedWhatsApp.map((x) => ({id: x.id, title: x.name || x.phone || "Unknown WhatsApp contact", detail: preview(x.message), date: x.createdAt}))},
    {title: "Buyer requests", href: "/admin/buyer-account-requests", items: buyerRequests.map((x) => ({id: x.id, title: x.organisationName || x.contactName, detail: x.status, date: x.createdAt}))},
    {title: "Order requests", href: "/admin/order-requests", items: orderRequests.map((x) => ({id: x.id, title: x.buyerName, detail: preview(x.items), date: x.createdAt}))},
    {title: "Email delivery", href: `${PATH}?view=email`, items: emails.map((x) => ({id: x.id, title: `${x.recipient} · ${x.status}`, detail: preview(x.subject), date: x.createdAt}))},
    {title: "Open reconciliation", href: `${PATH}?view=reconciliation`, items: incidents.map((x) => ({id: x.id, title: `${x.provider} · ${x.status}`, detail: preview(x.reason), date: x.createdAt}))},
    {title: "Open operational events", href: `${PATH}?view=operations`, items: operationalEvents.map((x) => ({id: x.id, title: `${x.category} · ${x.severity}`, detail: preview(x.summary), date: x.createdAt}))},
  ];
  return <><p className="rounded-xl bg-[#fff6d6] px-4 py-3 text-sm text-[#6b4b00]">Recent previews are independently capped at 8 records per source; they are not a globally paginated timeline.</p><div className="grid gap-4 lg:grid-cols-2">{sections.map((section) => <section key={section.title} className="rounded-2xl border border-[#102015]/10 bg-white p-4"><div className="flex justify-between gap-3"><h2 className="font-black">{section.title}</h2><Link href={section.href} className="text-sm font-black text-[#1f7a3f]">View all</Link></div><div className="mt-3 divide-y">{section.items.length ? section.items.map((item) => <div key={item.id} className="py-3"><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-sm text-[#405348]">{item.detail}</p><p className="mt-1 text-xs text-[#587063]">{formatDate(item.date)}</p></div>) : <p className="py-5 text-sm text-[#587063]">No records.</p>}</div></section>)}</div></>;
}

async function WhatsAppView({raw}: {raw: Params}) {
  const q = value(raw.q), direction = value(raw.direction), status = value(raw.status), pageSize = parseAdminPageSize(value(raw.pageSize)), page = parseAdminPage(value(raw.page));
  const where = {channel: "WhatsApp", ...(direction ? {direction} : {}), ...(status ? {status} : {}), ...(q ? {OR: [{title: {contains: q, mode: "insensitive" as const}}, {body: {contains: q, mode: "insensitive" as const}}, {recipient: {contains: q, mode: "insensitive" as const}}, {customer: {name: {contains: q, mode: "insensitive" as const}}}]} : {})};
  const [total, unknownCount, statuses] = await Promise.all([prisma.buyerMessage.count({where}), prisma.contactEnquiry.count({where: {enquiryType: "WhatsApp inbound"}}), prisma.buyerMessage.findMany({where: {channel: "WhatsApp"}, distinct: ["status"], select: {status: true}, orderBy: {status: "asc"}})]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const base = {view: "whatsapp", q, direction, status, pageSize};
  if (page > totalPages) redirect(adminListHref(PATH, base, {page: totalPages}));
  const messages = await prisma.buyerMessage.findMany({where, orderBy: [{createdAt: "desc"}, {id: "desc"}], skip: (page - 1) * pageSize, take: pageSize, include: {customer: {select: {id: true, name: true, phone: true}}}});
  const range = adminResultRange(page, pageSize, total);
  return <SourceList toolbar={<AdminListToolbar search={q} pageSize={pageSize} resetHref={`${PATH}?view=whatsapp`} hiddenParams={{view: "whatsapp"}} searchLabel="Search WhatsApp" searchPlaceholder="Buyer, recipient or message" filters={[{name: "direction", label: "Direction", value: direction, options: ["Inbound", "Outbound"].map((x) => ({value: x, label: x}))}, {name: "status", label: "Status", value: status, options: statuses.map((x) => ({value: x.status, label: x.status}))}]} />} range={range} total={total} label="messages" page={page} pages={totalPages} base={base} empty="No matching WhatsApp messages.">
    {unknownCount ? <Link href={`${PATH}?view=enquiries&type=WhatsApp+inbound`} className="block rounded-xl bg-[#fff6d6] px-4 py-3 text-sm font-bold text-[#6b4b00]">{unknownCount} unmatched WhatsApp contact{unknownCount === 1 ? "" : "s"} available in Enquiries</Link> : null}
    <div className="grid gap-3">{messages.map((message) => <article key={message.id} className="rounded-2xl border bg-white p-4"><div className="flex flex-wrap justify-between gap-3"><div><div className="flex gap-2"><AdminStatusPill tone={adminToneFromStatus(message.status)}>{message.status}</AdminStatusPill><span className="text-xs font-black uppercase text-[#587063]">{message.direction}</span></div><Link href={`/admin/customers/${message.customerId}`} className="mt-2 block font-black text-[#1f7a3f]">{message.customer.name}</Link><p className="text-xs text-[#587063]">{message.recipient || message.customer.phone || "No recipient"}</p></div><p className="text-xs text-[#587063]">{formatDate(message.createdAt)}</p></div><p className="mt-3 font-bold">{message.title}</p><p className="mt-1 text-sm text-[#405348]">{preview(message.body)}</p><details className="mt-3"><summary className="cursor-pointer text-sm font-black">Review</summary><p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p><div className="mt-3 flex flex-wrap gap-2">{relatedHref(message.relatedType, message.relatedId) ? <Link href={relatedHref(message.relatedType, message.relatedId)!} className="text-sm font-black text-[#1f7a3f]">Open related {message.relatedType}</Link> : null}{message.customer.phone ? <BuyerWhatsAppComposeButton customerId={message.customerId} phone={message.customer.phone} title={message.title} body={message.body} relatedType="BuyerMessage" relatedId={message.id} /> : null}</div><p className="mt-2 text-xs text-[#587063]">Source: {message.source || "Message log"}</p></details></article>)}</div>
  </SourceList>;
}

async function EmailView({raw}: {raw: Params}) {
  const q = value(raw.q), status = value(raw.status), pageSize = parseAdminPageSize(value(raw.pageSize)), page = parseAdminPage(value(raw.page));
  const where = {...(status ? {status} : {}), ...(q ? {OR: [{recipient: {contains: q, mode: "insensitive" as const}}, {subject: {contains: q, mode: "insensitive" as const}}, {template: {contains: q, mode: "insensitive" as const}}, {relatedId: {contains: q, mode: "insensitive" as const}}]} : {})};
  const [total, statuses] = await Promise.all([prisma.emailDelivery.count({where}), prisma.emailDelivery.findMany({distinct: ["status"], select: {status: true}, orderBy: {status: "asc"}})]);
  const pages = Math.max(1, Math.ceil(total / pageSize)), base = {view: "email", q, status, pageSize};
  if (page > pages) redirect(adminListHref(PATH, base, {page: pages}));
  const deliveries = await prisma.emailDelivery.findMany({where, orderBy: [{createdAt: "desc"}, {id: "desc"}], skip: (page - 1) * pageSize, take: pageSize});
  const range = adminResultRange(page, pageSize, total);
  return <SourceList toolbar={<AdminListToolbar search={q} pageSize={pageSize} resetHref={`${PATH}?view=email`} hiddenParams={{view: "email"}} searchLabel="Search delivery evidence" searchPlaceholder="Recipient, subject, template or related ID" filters={[{name: "status", label: "Status", value: status, options: statuses.map((x) => ({value: x.status, label: x.status}))}]} />} range={range} total={total} label="deliveries" page={page} pages={pages} base={base} empty="No matching email deliveries."><div className="grid gap-3">{deliveries.map((delivery) => <article key={delivery.id} className="rounded-2xl border bg-white p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{delivery.recipient}</p><p className="text-sm text-[#405348]">{delivery.subject}</p><p className="text-xs text-[#587063]">{delivery.template} · attempt {formatDate(delivery.lastAttemptAt || delivery.createdAt)}</p></div><AdminStatusPill tone={adminToneFromStatus(delivery.status)}>{delivery.status}</AdminStatusPill></div><details className="mt-3"><summary className="cursor-pointer text-sm font-black">Review</summary><p className="mt-2 text-sm">{delivery.lastError || delivery.latestEventType || "No failure detail recorded."}</p><p className="mt-2 text-xs text-[#587063]">Attempts: {delivery.retryCount} · Related: {delivery.relatedType || "None"} {delivery.relatedId || ""}</p>{delivery.status === "Failed" ? <form action={retryFailedEmailAction} className="mt-3"><input type="hidden" name="deliveryId" value={delivery.id}/><button className="rounded-lg bg-[#1f7a3f] px-3 py-2 text-sm font-black text-white">Retry email</button></form> : null}</details></article>)}</div></SourceList>;
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

async function ReconciliationView({raw, canResolve}: {raw: Params; canResolve: boolean}) {
  const q = value(raw.q), status = value(raw.status), pageSize = parseAdminPageSize(value(raw.pageSize)), page = parseAdminPage(value(raw.page));
  const where = {...(status ? {status} : {}), ...(q ? {OR: [{provider: {contains: q, mode: "insensitive" as const}}, {internalReference: {contains: q, mode: "insensitive" as const}}, {providerReference: {contains: q, mode: "insensitive" as const}}, {reason: {contains: q, mode: "insensitive" as const}}]} : {})};
  const [total, statuses] = await Promise.all([prisma.paymentReconciliationIncident.count({where}), prisma.paymentReconciliationIncident.findMany({distinct: ["status"], select: {status: true}, orderBy: {status: "asc"}})]);
  const pages = Math.max(1, Math.ceil(total / pageSize)), base = {view: "reconciliation", q, status, pageSize};
  if (page > pages) redirect(adminListHref(PATH, base, {page: pages}));
  const incidents = await prisma.paymentReconciliationIncident.findMany({where, orderBy: [{createdAt: "desc"}, {id: "desc"}], skip: (page - 1) * pageSize, take: pageSize});
  const range = adminResultRange(page, pageSize, total);
  return <SourceList toolbar={<AdminListToolbar search={q} pageSize={pageSize} resetHref={`${PATH}?view=reconciliation`} hiddenParams={{view: "reconciliation"}} searchLabel="Search incidents" searchPlaceholder="Provider, reference or reason" filters={[{name: "status", label: "Status", value: status, options: statuses.map((x) => ({value: x.status, label: x.status}))}]} />} range={range} total={total} label="incidents" page={page} pages={pages} base={base} empty="No matching reconciliation incidents."><div className="grid gap-3">{incidents.map((incident) => <article key={incident.id} className="rounded-2xl border bg-white p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{incident.provider} · {incident.internalReference || incident.providerReference || "Unknown reference"}</p><p className="text-xs text-[#587063]">{formatDate(incident.createdAt)}</p></div><AdminStatusPill tone={adminToneFromStatus(incident.status)}>{incident.status}</AdminStatusPill></div><p className="mt-3 text-sm">{preview(incident.reason)}</p><details className="mt-3"><summary className="cursor-pointer text-sm font-black">Review</summary><p className="mt-2 whitespace-pre-wrap text-sm">{incident.reason}</p><p className="mt-2 text-xs text-[#587063]">Internal: {incident.internalReference || "unknown"} · Provider: {incident.providerReference || "unknown"}{incident.resolutionNote ? ` · Resolution: ${incident.resolutionNote}` : ""}</p>{canResolve ? <form action={resolvePaymentIncidentAction} className="mt-3 grid gap-2 md:grid-cols-[12rem_1fr_auto]"><input type="hidden" name="incidentId" value={incident.id}/><select name="status" required className="rounded-lg border px-3 py-2"><option>Investigating</option><option>Resolved as paid</option><option>Resolved as unpaid</option><option>Ignored as invalid/test</option></select><input name="resolutionNote" required minLength={3} placeholder="Required resolution note" className="rounded-lg border px-3 py-2"/><button className="rounded-lg bg-[#102015] px-3 py-2 font-black text-white">Update</button></form> : <p className="mt-3 text-xs font-bold text-[#587063]">Finance resolution is restricted to authorised roles.</p>}</details></article>)}</div></SourceList>;
}

function SourceList({toolbar, range, total, label, page, pages, base, empty, children}: {toolbar: React.ReactNode; range: {start: number; end: number}; total: number; label: string; page: number; pages: number; base: Record<string, unknown>; empty: string; children: React.ReactNode}) {
  return <div className="grid gap-4">{toolbar}<AdminResultCount {...range} total={total} label={label}/>{total ? children : <AdminEmptyState title={empty} description="Try a different search term or clear one or more filters." resetHref={adminListHref(PATH, {view: base.view})}/>}<AdminPagination page={page} totalPages={pages} previousHref={page > 1 ? adminListHref(PATH, base, {page: page - 1}) : undefined} nextHref={page < pages ? adminListHref(PATH, base, {page: page + 1}) : undefined}/></div>;
}
