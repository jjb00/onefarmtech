import Link from "next/link";
import {redirect} from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import {AdminEmptyState, AdminListToolbar, AdminPagination, AdminResultCount} from "@/components/admin/AdminListControls";
import {AdminStatusPill, adminToneFromStatus} from "@/components/admin/AdminViewControls";
import {formatOrderTotal, getOrderItemsSummary} from "@/data/dbOrders";
import {adminListHref, adminResultRange, parseAdminPage, parseAdminPageSize} from "@/lib/adminListParams.js";
import {prisma} from "@/lib/prisma";
import {requireStaff} from "@/lib/auth";
import AdminRecordControls from "@/components/admin/AdminRecordControls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const PATH = "/admin/orders";
const VIEWS = ["needs-action", "new-requests", "awaiting-payment", "fulfilment", "completed", "cancelled", "all"];
type Params = Record<string, string | string[] | undefined>;
const text = (value: string | string[] | undefined) => String(Array.isArray(value) ? value[0] : value || "").trim();

function viewWhere(view: string) {
  if (view === "awaiting-payment") return {paymentStatus: {in: ["Unpaid", "Pending"]}};
  if (view === "fulfilment") return {paymentStatus: {in: ["Paid", "Approved"]}, fulfilmentStatus: {notIn: ["Delivered", "Collected", "Completed", "Cancelled"]}};
  if (view === "completed") return {fulfilmentStatus: {in: ["Delivered", "Collected", "Completed"]}};
  if (view === "cancelled") return {fulfilmentStatus: {contains: "cancel", mode: "insensitive" as const}};
  if (view === "all") return {};
  return {OR: [
    {paymentStatus: {in: ["Unpaid", "Pending", "Failed"]}},
    {fulfilmentStatus: {in: ["New order", "Pending", "Confirmed", "Preparing", "Ready for pickup"]}},
    {paymentRequests: {some: {status: {in: ["Failed", "Expired"]}}}},
    {complaints: {some: {status: {notIn: ["Resolved", "Closed"]}}}},
  ]};
}

export default async function OrdersPage({searchParams}: {searchParams?: Promise<Params>}) {
  const staff = await requireStaff();
  const raw = await searchParams;
  const requested = text(raw?.view) || "needs-action";
  const view = VIEWS.includes(requested) ? requested : "needs-action";
  const q = text(raw?.q);
  const page = parseAdminPage(text(raw?.page));
  const pageSize = parseAdminPageSize(text(raw?.pageSize));
  if (view === "new-requests") return <NewRequestsView q={q} page={page} pageSize={pageSize} canDelete={staff.role === "Super admin"} />;
  const where = {
    AND: [
      viewWhere(view),
      ...(q ? [{OR: [
        {code: {contains: q, mode: "insensitive" as const}},
        {buyerName: {contains: q, mode: "insensitive" as const}},
        {phone: {contains: q}},
        {items: {some: {name: {contains: q, mode: "insensitive" as const}}}},
      ]}] : []),
    ],
  };
  const total = await prisma.order.count({where});
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = {view, q, pageSize};
  if (page > pages) redirect(adminListHref(PATH, base, {page: pages}));
  const orders = await prisma.order.findMany({
    where,
    orderBy: [{updatedAt: "asc"}, {id: "asc"}],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true, code: true, buyerName: true, buyerType: true, phone: true,
      paymentStatus: true, fulfilmentStatus: true, estimatedTotal: true,
      deliveryMethod: true, updatedAt: true,
      items: {select: {name: true, quantity: true, unit: true}, take: 4},
      paymentRequests: {where: {status: {in: ["Failed", "Expired"]}}, select: {status: true}, take: 1},
      _count: {select: {complaints: true}},
    },
  });
  const labels = [
    ["needs-action", "Needs action"], ["new-requests", "New requests"], ["awaiting-payment", "Awaiting payment"],
    ["fulfilment", "Fulfilment"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["all", "All orders"],
  ];
  const nextAction = (order: typeof orders[number]) => {
    if (order.paymentRequests.length) return "Review failed payment";
    if (["Unpaid", "Pending", "Failed"].includes(order.paymentStatus)) return "Request payment";
    if (order.deliveryMethod.toLowerCase().includes("pickup")) return "Update pickup";
    if (!["Delivered", "Collected", "Completed"].includes(order.fulfilmentStatus)) return "Update fulfilment";
    return "Open order";
  };
  const range = adminResultRange(page, pageSize, total);
  return (
    <AdminShell title="Orders" description="Prioritised order work with server-side search and pagination." compactHeader action={<Link href="/admin/create-order" className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white">New order</Link>}>
      <div className="grid gap-5">
        <nav aria-label="Order views" className="flex gap-2 overflow-x-auto pb-2">{labels.map(([value, label]) => <Link key={value} href={adminListHref(PATH, {view: value, q})} aria-current={view === value ? "page" : undefined} className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-black ${view === value ? "bg-[#102015] text-white" : "border bg-white"}`}>{label}</Link>)}</nav>
        <AdminListToolbar search={q} filters={[]} pageSize={pageSize} resetHref={`${PATH}?view=${view}`} hiddenParams={{view}} searchLabel="Search orders" searchPlaceholder="Order code, buyer, phone or item" />
        <AdminResultCount {...range} total={total} label="orders" />
        {orders.length ? <>
          <section className="grid gap-3 md:hidden">{orders.map((order) => <article key={order.id} className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex justify-between gap-3"><div><Link href={`/admin/orders/${order.id}`} className="font-black text-[#1f7a3f]">{order.code}</Link><p className="font-bold">{order.buyerName}</p></div><p className="font-black">{formatOrderTotal(order.estimatedTotal)}</p></div><p className="mt-2 text-sm text-[#405348]">{getOrderItemsSummary(order.items)}</p><div className="mt-3 flex flex-wrap gap-2"><AdminStatusPill tone={adminToneFromStatus(order.paymentStatus)}>{order.paymentStatus}</AdminStatusPill><AdminStatusPill tone={adminToneFromStatus(order.fulfilmentStatus)}>{order.fulfilmentStatus}</AdminStatusPill></div><Link href={`/admin/orders/${order.id}`} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#1f7a3f] px-4 text-sm font-black text-white">{nextAction(order)}</Link>{staff.role === "Super admin" ? <AdminRecordControls recordType="Order" recordId={order.id} canDelete /> : null}</article>)}</section>
          <section className="hidden overflow-x-auto rounded-2xl border bg-white md:block"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-[#f3f8ef] text-xs uppercase"><tr><th className="p-4">Order</th><th className="p-4">Buyer</th><th className="p-4">Items</th><th className="p-4">Amount</th><th className="p-4">Payment</th><th className="p-4">Fulfilment</th><th className="p-4">Last activity</th><th className="p-4">Next action</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-t align-middle"><td className="p-4"><Link href={`/admin/orders/${order.id}`} className="font-black text-[#1f7a3f]">{order.code}</Link></td><td className="p-4"><p className="font-bold">{order.buyerName}</p><p className="text-xs text-[#587063]">{order.phone}</p></td><td className="max-w-56 truncate p-4">{getOrderItemsSummary(order.items)}</td><td className="p-4 font-black">{formatOrderTotal(order.estimatedTotal)}</td><td className="p-4"><AdminStatusPill tone={adminToneFromStatus(order.paymentStatus)}>{order.paymentStatus}</AdminStatusPill></td><td className="p-4"><AdminStatusPill tone={adminToneFromStatus(order.fulfilmentStatus)}>{order.fulfilmentStatus}</AdminStatusPill></td><td className="p-4">{order.updatedAt.toLocaleDateString("en-GB")}</td><td className="p-4"><Link href={`/admin/orders/${order.id}`} className="inline-flex min-h-11 items-center rounded-full px-3 font-black text-[#1f7a3f]">{nextAction(order)}</Link>{staff.role === "Super admin" ? <AdminRecordControls recordType="Order" recordId={order.id} canDelete /> : null}</td></tr>)}</tbody></table></section>
        </> : <AdminEmptyState title="No orders match this view." description="Try a different search or view." resetHref={`${PATH}?view=${view}`} />}
        <AdminPagination page={page} totalPages={pages} previousHref={page > 1 ? adminListHref(PATH, base, {page: page - 1}) : undefined} nextHref={page < pages ? adminListHref(PATH, base, {page: page + 1}) : undefined} />
      </div>
    </AdminShell>
  );
}

function requestSource(source: string) {
  const value = source.toLowerCase();
  if (value.includes("whatsapp")) return "WhatsApp";
  if (value.includes("admin") || value.includes("manual")) return "Manual";
  return "Online";
}

async function NewRequestsView({q, page, pageSize, canDelete}: {q: string; page: number; pageSize: number; canDelete: boolean}) {
  const where = {
    status: {in: ["New", "Reviewing"]},
    ...(q ? {OR: [
      {buyerName: {contains: q, mode: "insensitive" as const}},
      {phone: {contains: q}},
      {items: {contains: q, mode: "insensitive" as const}},
    ]} : {}),
  };
  const total = await prisma.orderRequest.count({where});
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const base = {view: "new-requests", q, pageSize};
  if (page > pages) redirect(adminListHref(PATH, base, {page: pages}));
  const requests = await prisma.orderRequest.findMany({
    where,
    orderBy: [{updatedAt: "asc"}, {id: "asc"}],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {id: true, buyerName: true, phone: true, items: true, source: true, status: true, updatedAt: true},
  });
  const range = adminResultRange(page, pageSize, total);
  return (
    <AdminShell title="Orders" description="New requests and prioritised order work." compactHeader action={<Link href="/admin/create-order" className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white">New order</Link>}>
      <div className="grid gap-5">
        <nav aria-label="Order views" className="flex gap-2 overflow-x-auto pb-2">{[
          ["needs-action", "Needs action"], ["new-requests", "New requests"], ["awaiting-payment", "Awaiting payment"],
          ["fulfilment", "Fulfilment"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["all", "All orders"],
        ].map(([value, label]) => <Link key={value} href={adminListHref(PATH, {view: value, pageSize})} aria-current={value === "new-requests" ? "page" : undefined} className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-black ${value === "new-requests" ? "bg-[#102015] text-white" : "border bg-white"}`}>{label}</Link>)}</nav>
        <AdminListToolbar search={q} filters={[]} pageSize={pageSize} resetHref={`${PATH}?view=new-requests`} hiddenParams={{view: "new-requests"}} searchLabel="Search requests" searchPlaceholder="Buyer, phone or requested items" />
        <AdminResultCount {...range} total={total} label="new requests" />
        <div className="grid gap-3">{requests.map((request) => <article key={request.id} className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">{request.buyerName}</p><p className="text-xs text-[#587063]">{request.phone} · {requestSource(request.source)}</p></div><AdminStatusPill tone={adminToneFromStatus(request.status)}>{request.status}</AdminStatusPill></div><p className="mt-3 text-sm text-[#405348]">{request.items}</p><Link href={`/admin/order-requests?focus=${request.id}`} className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#1f7a3f] px-4 text-sm font-black text-white">Review request</Link>{canDelete ? <AdminRecordControls recordType="OrderRequest" recordId={request.id} canDelete /> : null}</article>)}</div>
        {!requests.length ? <AdminEmptyState title="No new requests." description="No order requests match this search." resetHref={`${PATH}?view=new-requests`} /> : null}
        <AdminPagination page={page} totalPages={pages} previousHref={page > 1 ? adminListHref(PATH, base, {page: page - 1}) : undefined} nextHref={page < pages ? adminListHref(PATH, base, {page: page + 1}) : undefined} />
      </div>
    </AdminShell>
  );
}
