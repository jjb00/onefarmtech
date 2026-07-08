import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import AdminDisclosure from "@/components/admin/AdminDisclosure";
import StatusBadge from "@/components/admin/StatusBadge";
import {getDbOrders, getDbOrderStats, formatOrderTotal} from "@/data/dbOrders";
import {
  getDbComplaints,
  getDbCustomers,
  getDbPayments,
  getDbProducts,
  getDbSuppliers,
} from "@/data/dbAdmin";
import {formatNaira} from "@/lib/format";
import {prisma} from "@/lib/prisma";
import {getCurrentStaffActor} from "@/lib/currentStaff";
import {canAccessAdminPath} from "@/lib/adminAccess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminDashboardPageProps = {
  searchParams?: Promise<{
    access?: string;
    blocked?: string;
  }>;
};

export default async function AdminDashboardPage({searchParams}: AdminDashboardPageProps) {
  const params = await searchParams;
  const staff = await getCurrentStaffActor();
  const accessDenied = params?.access === "denied";

  const [
    orders,
    stats,
    customers,
    products,
    suppliers,
    payments,
    complaints,
    receipts,
    auditLogs,
    staffUsers,
    buyerAccountRequests,
    buyerProfileUpdateRequests,
  ] = await Promise.all([
    getDbOrders(),
    getDbOrderStats(),
    getDbCustomers(),
    getDbProducts(),
    getDbSuppliers(),
    getDbPayments(),
    getDbComplaints(),
    prisma.receipt.findMany({orderBy: {issuedAt: "desc"}, take: 5}),
    prisma.auditLog.findMany({orderBy: {createdAt: "desc"}, take: 5}),
    prisma.staffUser.findMany({orderBy: {createdAt: "desc"}, take: 10}),
    prisma.buyerAccountRequest.findMany({orderBy: {createdAt: "desc"}, take: 20}),
    prisma.buyerProfileUpdateRequest.findMany({
      orderBy: {createdAt: "desc"},
      include: {customer: true},
      take: 20,
    }),
  ]);

  const paymentTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const receiptTotal = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const activeComplaints = complaints.filter(
    (complaint) => !["Closed", "Resolved"].includes(complaint.status),
  );
  const recentOrders = orders.slice(0, 5);
  const buyerLoginReady = customers.filter((customer) => customer.accountLoginReady).length;
  const totalCreditLimit = customers.reduce((sum, customer) => sum + customer.creditLimit, 0);
  const outstandingBalance = customers.reduce(
    (sum, customer) => sum + customer.outstandingBalance,
    0,
  );
  const newBuyerAccountRequests = buyerAccountRequests.filter(
    (request) => request.status === "New",
  );
  const reviewingBuyerAccountRequests = buyerAccountRequests.filter(
    (request) => request.status === "Reviewing",
  );
  const openBuyerProfileUpdateRequests = buyerProfileUpdateRequests.filter(
    (request) => ["New", "Reviewing"].includes(request.status),
  );

  const quickActions = [
    ["Create order", "/admin/create-order"],
    ["Add customer", "/admin/customers"],
    ["Buyer accounts", "/admin/buyer-accounts"],
    ["Buyer access", "/admin/buyer-access"],
    ["Profile updates", "/admin/buyer-profile-requests"],
    ["Buyer messages", "/admin/buyer-messages"],
    ["Issue receipt", "/admin/receipts"],
    ["Audit log", "/admin/audit-log"],
    ["Staff & roles", "/admin/staff"],
    ["Deployment readiness", "/admin/deployment-readiness"],
    ["Operating manual", "/admin/operating-manual"],
  ].filter(([, href]) => canAccessAdminPath(staff.role, href));

  return (
    <AdminShell
      title="Admin dashboard"
      description="Database-backed operating view for orders, buyers, suppliers, payments, receipts, staff roles, audit logs, and issues."
      action={
        <Link
          href="/admin/create-order"
          className="rounded-full bg-[#9ee6ad] px-6 py-4 text-center font-semibold text-[#102015]"
        >
          Create order
        </Link>
      }
    >
      <section className="mt-10 grid gap-8">
        {accessDenied ? (
          <div className="rounded-[2rem] border border-[#C95F3D]/20 bg-[#C95F3D]/10 p-5 text-[#102015]">
            <p className="text-lg font-black">Access not available for this role</p>
            <p className="mt-2 text-sm leading-6 text-[#405348]">
              Your current session role is <strong>{staff.role}</strong>. That role does not have access to the page you tried to open.
              Use the visible navigation links for the areas available to this role, or sign out and use the correct staff role.
            </p>
          </div>
        ) : null}

        {openBuyerProfileUpdateRequests.length ? (
          <section className="rounded-[2rem] border border-[#3E7A4C]/20 bg-[#eef8ed] p-5 text-[#102015] shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1f7a3f]">
                  Buyer profile updates
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {openBuyerProfileUpdateRequests.length} profile update request{openBuyerProfileUpdateRequests.length === 1 ? "" : "s"} need review
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#405348]">
                  Review buyer-submitted company, contact, finance and partner-readiness updates before changing approved account records.
                </p>
              </div>

              <Link
                href="/admin/buyer-profile-requests"
                className="rounded-2xl bg-[#1f7a3f] px-5 py-4 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#155c2f]"
              >
                Review profile updates
              </Link>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {openBuyerProfileUpdateRequests.slice(0, 3).map((request) => (
                <Link
                  key={request.id}
                  href="/admin/buyer-profile-requests"
                  className="rounded-2xl bg-white p-4 text-sm shadow-sm transition hover:bg-[#f3f8ef]"
                >
                  <p className="font-black text-[#102015]">{request.customer.name}</p>
                  <p className="mt-1 text-xs leading-5 text-[#587063]">
                    {request.status} · {request.requestType}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {newBuyerAccountRequests.length || reviewingBuyerAccountRequests.length ? (
          <section className="rounded-[2rem] border border-[#F2B84B]/30 bg-[#fff8e4] p-5 text-[#102015] shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C95F3D]">
                  Buyer account attention
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {newBuyerAccountRequests.length} new request{newBuyerAccountRequests.length === 1 ? "" : "s"} need review
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#405348]">
                  Review new buyer account requests, approve suitable buyers, then generate a buyer login access code in Buyer access.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[28rem]">
                <Link
                  href="/admin/buyer-account-requests"
                  className="rounded-2xl bg-[#1f7a3f] px-5 py-4 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#155c2f]"
                >
                  Review buyer requests
                </Link>
                <Link
                  href="/admin/buyer-access"
                  className="rounded-2xl border border-[#102015]/10 bg-white px-5 py-4 text-center text-sm font-black text-[#102015] shadow-sm transition hover:bg-[#f3f8ef]"
                >
                  Generate access code
                </Link>
              </div>
            </div>

            {buyerAccountRequests.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {buyerAccountRequests.slice(0, 3).map((request) => (
                  <Link
                    key={request.id}
                    href="/admin/buyer-account-requests"
                    className="rounded-2xl bg-white p-4 text-sm shadow-sm transition hover:bg-[#f3f8ef]"
                  >
                    <p className="font-black text-[#102015]">
                      {request.organisationName || request.contactName}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#587063]">
                      {request.status} · {request.buyerType} · {request.phone}
                    </p>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-[#102015]/10 bg-white p-5 text-[#102015]"
            >
              <p className="text-sm text-[#587063]">{stat.label}</p>
              <p className="mt-2 text-3xl font-black">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Customers" value={String(customers.length)} href="/admin/customers" />
          <MetricCard label="Buyer login ready" value={String(buyerLoginReady)} href="/admin/buyer-accounts" />
          <MetricCard label="Credit exposure" value={formatNaira(totalCreditLimit)} href="/admin/buyer-accounts" />
          <MetricCard label="Outstanding balance" value={formatNaira(outstandingBalance)} href="/admin/buyer-accounts" />
          <MetricCard label="Products" value={String(products.length)} href="/admin/products" />
          <MetricCard label="Supply partners" value={String(suppliers.length)} href="/admin/suppliers" />
          <MetricCard label="Payments recorded" value={formatNaira(paymentTotal)} href="/admin/payments" />
          <MetricCard label="Receipts issued" value={formatNaira(receiptTotal)} href="/admin/receipts" />
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <AdminDisclosure title="Recent orders" defaultOpen={false}>
            <section className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
              <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Recent orders</h2>
                <p className="mt-1 text-sm text-[#405348]">
                  Latest database orders requiring admin attention.
                </p>
              </div>
              <Link
                href="/admin/orders"
                className="rounded-full border border-[#1f7a3f]/20 px-4 py-2 text-sm font-bold text-[#1f7a3f]"
              >
                View all
              </Link>
            </div>

            <div className="mt-6 grid gap-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.code}`}
                  className="rounded-2xl bg-[#f7f5ec] p-5 transition hover:bg-[#eef1e4]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#1f7a3f]">
                        {order.code}
                      </p>
                      <h3 className="mt-1 text-xl font-black">{order.buyerName}</h3>
                      <p className="mt-1 text-sm text-[#405348]">
                        {order.deliveryMethod}
                      </p>
                    </div>
                    <div className="grid gap-2 md:justify-items-end">
                      <StatusBadge status={order.paymentStatus} />
                      <p className="font-bold">{formatOrderTotal(order.estimatedTotal)}</p>
                    </div>
                  </div>
                </Link>
              ))}

              {!recentOrders.length ? (
                <p className="rounded-2xl bg-[#f7f5ec] p-5 text-sm text-[#405348]">
                  No orders yet.
                </p>
              ) : null}
            </div>
            </section>
          </AdminDisclosure>

          <aside className="grid gap-8">
            <AdminDisclosure title="Issue watch" defaultOpen={false}>
              <section className="rounded-[2rem] bg-white p-6 text-[#102015]">
                <h2 className="text-2xl font-bold">Issue watch</h2>
              <p className="mt-2 text-sm text-[#587063]">
                Active complaints and unresolved order issues.
              </p>

              <div className="mt-6 grid gap-4">
                {activeComplaints.length === 0 ? (
                  <p className="rounded-2xl bg-white p-4 text-sm text-[#405348]">
                    No active complaints.
                  </p>
                ) : (
                  activeComplaints.slice(0, 4).map((complaint) => (
                    <Link
                      key={complaint.id}
                      href={`/admin/orders/${complaint.order.code}`}
                      className="rounded-2xl bg-white p-4"
                    >
                      <p className="font-bold text-[#1f7a3f]">{complaint.code}</p>
                      <p className="mt-1 text-sm text-[#405348]">{complaint.issue}</p>
                      <p className="mt-2 text-xs text-[#587063]">
                        Order {complaint.order.code} · {complaint.priority}
                      </p>
                    </Link>
                  ))
                )}
              </div>
              </section>
            </AdminDisclosure>

            <AdminDisclosure title="Recent audit activity" defaultOpen={false}>
              <section className="rounded-[2rem] bg-white p-6 text-[#102015]">
                <h2 className="text-2xl font-bold">Recent audit activity</h2>
              <div className="mt-6 grid gap-3">
                {auditLogs.map((log) => (
                  <Link
                    key={log.id}
                    href="/admin/audit-log"
                    className="rounded-2xl bg-white p-4"
                  >
                    <p className="font-bold text-[#1f7a3f]">{log.action}</p>
                    <p className="mt-1 text-xs text-[#587063]">
                      {log.entityType}
                      {log.entityLabel ? ` · ${log.entityLabel}` : ""} ·{" "}
                      {log.createdAt.toLocaleString()}
                    </p>
                  </Link>
                ))}

                {!auditLogs.length ? (
                  <p className="rounded-2xl bg-white p-4 text-sm text-[#405348]">
                    No audit activity yet.
                  </p>
                ) : null}
              </div>
              </section>
            </AdminDisclosure>

            <AdminDisclosure title="Control readiness" defaultOpen={false}>
              <section className="rounded-[2rem] bg-white p-6 text-[#102015]">
                <h2 className="text-2xl font-bold">Control readiness</h2>
              <div className="mt-6 grid gap-3 text-sm">
                <ControlRow label="Staff records" value={String(staffUsers.length)} href="/admin/staff" />
                <ControlRow label="Audit events" value={String(auditLogs.length)} href="/admin/audit-log" />
                <ControlRow label="Receipt records" value={String(receipts.length)} href="/admin/receipts" />
              </div>
              </section>
            </AdminDisclosure>

            <AdminDisclosure title="Quick actions" defaultOpen={false}>
              <section className="rounded-[2rem] bg-white p-6 text-[#102015]">
                <h2 className="text-2xl font-bold">Quick actions</h2>
              <div className="mt-6 grid gap-3">
                {quickActions.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-2xl bg-white px-4 py-3 font-semibold text-[#1f7a3f]"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              </section>
            </AdminDisclosure>
          </aside>
        </div>
      </section>
    </AdminShell>
  );
}

function MetricCard({label, value, href}: {label: string; value: string; href: string}) {
  return (
    <Link href={href} className="rounded-3xl bg-white p-5 text-[#102015] transition hover:translate-y-[-1px]">
      <p className="text-sm text-[#405348]">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </Link>
  );
}

function ControlRow({label, value, href}: {label: string; value: string; href: string}) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
      <span className="font-semibold text-[#405348]">{label}</span>
      <span className="font-black text-[#1f7a3f]">{value}</span>
    </Link>
  );
}
