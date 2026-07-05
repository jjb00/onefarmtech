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
import {getCurrentStaffActor} from "@/lib/currentStaff";
import {canAccessAdminPath} from "@/lib/adminAccess";

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

  const quickActions = [
    ["Create order", "/admin/create-order"],
    ["Add customer", "/admin/customers"],
    ["Buyer accounts", "/admin/buyer-accounts"],
    ["Buyer access", "/admin/buyer-access"],
    ["Issue receipt", "/admin/receipts"],
    ["Audit log", "/admin/audit-log"],
    ["Staff & roles", "/admin/staff"],
    ["Deployment readiness", "/admin/deployment-readiness"],
    ["Operating manual", "/admin/operating-manual"],
  ].filter(([, href]) => canAccessAdminPath(staff.role, href));

  const dashboardGroups = [
    {
      title: "Launch operations",
      description: "Review new buyer requests, order requests and public enquiries.",
      links: [
        ["Launch inbox", "/admin/launch-inbox", "All incoming launch requests in one place."],
        ["Order requests", "/admin/order-requests", "Fresh produce requests submitted from the public site."],
        ["Account requests", "/admin/buyer-account-requests", "Buyer account setup requests awaiting review."],
        ["Contact enquiries", "/admin/contact-enquiries", "General support, supplier and buyer messages."],
      ],
    },
    {
      title: "Orders & fulfilment",
      description: "Create, manage and fulfil orders from WhatsApp-first operations.",
      links: [
        ["Create order", "/admin/create-order", "Manually create a buyer order."],
        ["Orders", "/admin/orders", "Track submitted and active orders."],
        ["Draft orders", "/admin/drafts", "Review local draft orders before processing."],
        ["Deliveries", "/admin/deliveries", "Manage delivery and pickup activity."],
        ["Group-buys", "/admin/group-buys", "Coordinate pooled buyer demand."],
        ["Pickup locations", "/admin/pickup-locations", "Manage pickup points and coverage."],
      ],
    },
    {
      title: "Commercial records",
      description: "Maintain buyer, product and supplier records.",
      links: [
        ["Customers", "/admin/customers", "Buyer records and order history."],
        ["Buyer accounts", "/admin/buyer-accounts", "Approved buyer profiles and account status."],
        ["Buyer access", "/admin/buyer-access", "Login readiness and buyer access control."],
        ["Products", "/admin/products", "Catalogue, availability and product status."],
        ["Suppliers", "/admin/suppliers", "Supply partners and fulfilment contacts."],
      ],
    },
    {
      title: "Finance",
      description: "Track payments, receipts and finance-facing records.",
      links: [
        ["Payments", "/admin/payments", "Payment records and reconciliation status."],
        ["Receipts", "/admin/receipts", "Issue and view buyer receipts."],
      ],
    },
    {
      title: "Support & operations",
      description: "Handle issues, WhatsApp workflows and internal operating guidance.",
      links: [
        ["Complaints", "/admin/complaints", "Buyer complaints and issue resolution."],
        ["WhatsApp ops", "/admin/whatsapp", "WhatsApp-first message workflows."],
        ["Workflows", "/admin/workflows", "Operational process checklists."],
        ["Operating manual", "/admin/operating-manual", "Internal launch operating guidance."],
      ],
    },
    {
      title: "Control room",
      description: "Manage staff, access, security, audit and deployment readiness.",
      links: [
        ["Staff", "/admin/staff", "Staff users and assigned roles."],
        ["Permissions", "/admin/permissions", "Role access reference."],
        ["Security", "/admin/security", "Admin security controls and notes."],
        ["Audit log", "/admin/audit-log", "Recorded admin actions."],
        ["Deployment readiness", "/admin/deployment-readiness", "Launch readiness checks."],
      ],
    },
  ]
    .map((group) => ({
      ...group,
      links: group.links.filter(([, href]) => canAccessAdminPath(staff.role, href)),
    }))
    .filter((group) => group.links.length > 0);

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

        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015] shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Command centre
              </p>
              <h2 className="mt-3 text-2xl font-black">Admin work areas</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
                Use these grouped work areas to move quickly from launch inbox to orders, fulfilment, finance, support and control-room tasks.
              </p>
            </div>
            <p className="rounded-full bg-[#f3f8ef] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#1f7a3f]">
              {staff.role}
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {dashboardGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-3xl border border-[#102015]/10 bg-[#f7f5ec] p-5"
              >
                <h3 className="text-lg font-black">{group.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#405348]">{group.description}</p>

                <div className="mt-5 grid gap-3">
                  {group.links.map(([label, href, description]) => (
                    <DashboardLinkCard
                      key={href}
                      label={label}
                      href={href}
                      description={description}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

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

            <section className="rounded-[2rem] bg-white p-6 text-[#102015]">
              <h2 className="text-2xl font-bold">Control readiness</h2>
              <div className="mt-6 grid gap-3 text-sm">
                <ControlRow label="Staff records" value={String(staffUsers.length)} href="/admin/staff" />
                <ControlRow label="Audit events" value={String(auditLogs.length)} href="/admin/audit-log" />
                <ControlRow label="Receipt records" value={String(receipts.length)} href="/admin/receipts" />
              </div>
            </section>

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

function DashboardLinkCard({
  label,
  href,
  description,
}: {
  label: string;
  href: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white p-4 text-[#102015] transition hover:translate-y-[-1px] hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-black text-[#1f7a3f]">{label}</p>
          <p className="mt-1 text-sm leading-6 text-[#405348]">{description}</p>
        </div>
        <span className="text-lg font-black text-[#1f7a3f]" aria-hidden="true">
          →
        </span>
      </div>
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
