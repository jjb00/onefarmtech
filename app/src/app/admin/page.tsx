import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
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

export default async function AdminDashboardPage() {
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
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white"
            >
              <p className="text-sm text-white/50">{stat.label}</p>
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

          <aside className="grid gap-8">
            <section className="rounded-[2rem] bg-white/10 p-6 text-white">
              <h2 className="text-2xl font-bold">Issue watch</h2>
              <p className="mt-2 text-sm text-white/55">
                Active complaints and unresolved order issues.
              </p>

              <div className="mt-6 grid gap-4">
                {activeComplaints.length === 0 ? (
                  <p className="rounded-2xl bg-white/10 p-4 text-sm text-white/60">
                    No active complaints.
                  </p>
                ) : (
                  activeComplaints.slice(0, 4).map((complaint) => (
                    <Link
                      key={complaint.id}
                      href={`/admin/orders/${complaint.order.code}`}
                      className="rounded-2xl bg-white/10 p-4"
                    >
                      <p className="font-bold text-[#9ee6ad]">{complaint.code}</p>
                      <p className="mt-1 text-sm text-white/70">{complaint.issue}</p>
                      <p className="mt-2 text-xs text-white/45">
                        Order {complaint.order.code} · {complaint.priority}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/10 p-6 text-white">
              <h2 className="text-2xl font-bold">Recent audit activity</h2>
              <div className="mt-6 grid gap-3">
                {auditLogs.map((log) => (
                  <Link
                    key={log.id}
                    href="/admin/audit-log"
                    className="rounded-2xl bg-white/10 p-4"
                  >
                    <p className="font-bold text-[#9ee6ad]">{log.action}</p>
                    <p className="mt-1 text-xs text-white/50">
                      {log.entityType}
                      {log.entityLabel ? ` · ${log.entityLabel}` : ""} ·{" "}
                      {log.createdAt.toLocaleString()}
                    </p>
                  </Link>
                ))}

                {!auditLogs.length ? (
                  <p className="rounded-2xl bg-white/10 p-4 text-sm text-white/60">
                    No audit activity yet.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/10 p-6 text-white">
              <h2 className="text-2xl font-bold">Control readiness</h2>
              <div className="mt-6 grid gap-3 text-sm">
                <ControlRow label="Staff records" value={String(staffUsers.length)} href="/admin/staff" />
                <ControlRow label="Audit events" value={String(auditLogs.length)} href="/admin/audit-log" />
                <ControlRow label="Receipt records" value={String(receipts.length)} href="/admin/receipts" />
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/10 p-6 text-white">
              <h2 className="text-2xl font-bold">Quick actions</h2>
              <div className="mt-6 grid gap-3">
                {[
                  ["Create order", "/admin/create-order"],
                  ["Add customer", "/admin/customers"],
                  ["Buyer accounts", "/admin/buyer-accounts"],
                  ["Issue receipt", "/admin/receipts"],
                  ["Audit log", "/admin/audit-log"],
                  ["Staff & roles", "/admin/staff"],
                  ["Deployment readiness", "/admin/deployment-readiness"],
                  ["Operating manual", "/admin/operating-manual"],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-2xl bg-white/10 px-4 py-3 font-semibold text-[#9ee6ad]"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </section>
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
    <Link href={href} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
      <span className="font-semibold text-white/75">{label}</span>
      <span className="font-black text-[#F2B84B]">{value}</span>
    </Link>
  );
}
