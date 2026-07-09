import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {
  AdminCompactMetric,
  AdminStatusPill,
  AdminViewBar,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import {prisma} from "@/lib/prisma";
import {createCustomerAction} from "@/actions/createAdminRecords";
import {buyerTypes} from "@/constants/orderOptions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function money(value: number) {
  return `₦${value.toLocaleString()}`;
}

type CustomersPageProps = {
  searchParams?: Promise<{
    status?: string;
    date?: string;
    sort?: string;
  }>;
};

function hrefFor(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/admin/customers?${query}` : "/admin/customers";
}

function inDateRange(value: Date, range: string) {
  if (range === "all") return true;
  const now = new Date();
  const date = new Date(value);
  if (range === "today") return date.toDateString() === now.toDateString();
  if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo;
  }
  if (range === "month") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  if (range === "year") return date.getFullYear() === now.getFullYear();
  return true;
}

export default async function CustomersPage({searchParams}: CustomersPageProps) {
  const params = await searchParams;
  const status = params?.status || "all";
  const date = params?.date || "all";
  const sort = params?.sort || "newest";

  const customers = await prisma.customer.findMany({
    orderBy: {createdAt: "desc"},
    include: {
      orders: {
        select: {
          id: true,
          estimatedTotal: true,
          paymentStatus: true,
        },
      },
      receipts: {
        select: {
          id: true,
          amount: true,
        },
      },
    },
  });

  const filtered = customers.filter((customer) => {
    const key = `${customer.status} ${customer.accountStatus}`.toLowerCase();
    const statusMatch =
      status === "all" ||
      (status === "login-ready" && customer.accountLoginReady) ||
      key.includes(status);
    return statusMatch && inDateRange(customer.createdAt, date);
  });

  const sorted = [...filtered].sort((a, b) => {
    const aOrderValue = a.orders.reduce((sum, order) => sum + order.estimatedTotal, 0);
    const bOrderValue = b.orders.reduce((sum, order) => sum + order.estimatedTotal, 0);

    if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
    if (sort === "balance-high") return b.outstandingBalance - a.outstandingBalance;
    if (sort === "order-value") return bOrderValue - aOrderValue;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const activeCount = customers.filter((customer) => customer.status === "Active").length;
  const loginReadyCount = customers.filter((customer) => customer.accountLoginReady).length;
  const outstandingBalance = customers.reduce((sum, customer) => sum + customer.outstandingBalance, 0);
  const base = {status, date, sort};

  return (
    <AdminPageShell
      title="Customers"
      description="Buyer master records, contact details and account status."
    >
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-4">
          <AdminCompactMetric label="Customers" value={String(customers.length)} tone="blue" />
          <AdminCompactMetric label="Active" value={String(activeCount)} tone="green" />
          <AdminCompactMetric label="Login ready" value={String(loginReadyCount)} tone="green" />
          <AdminCompactMetric label="Outstanding" value={money(outstandingBalance)} tone={outstandingBalance > 0 ? "amber" : "neutral"} />
        </section>

        <AdminViewBar
          title="Customer controls"
          description={`${sorted.length} customer${sorted.length === 1 ? "" : "s"} shown.`}
          filterOptions={[
            {label: "All", href: hrefFor({...base, status: "all"}), active: status === "all"},
            {label: "Active", href: hrefFor({...base, status: "active"}), active: status === "active"},
            {label: "Login ready", href: hrefFor({...base, status: "login-ready"}), active: status === "login-ready"},
            {label: "Review", href: hrefFor({...base, status: "review"}), active: status === "review"},
            {label: "Paused", href: hrefFor({...base, status: "paused"}), active: status === "paused"},
          ]}
          dateOptions={[
            {label: "All time", href: hrefFor({...base, date: "all"}), active: date === "all"},
            {label: "Today", href: hrefFor({...base, date: "today"}), active: date === "today"},
            {label: "7 days", href: hrefFor({...base, date: "week"}), active: date === "week"},
            {label: "This month", href: hrefFor({...base, date: "month"}), active: date === "month"},
            {label: "This year", href: hrefFor({...base, date: "year"}), active: date === "year"},
          ]}
          sortOptions={[
            {label: "Newest", href: hrefFor({...base, sort: "newest"}), active: sort === "newest"},
            {label: "Oldest", href: hrefFor({...base, sort: "oldest"}), active: sort === "oldest"},
            {label: "Balance high", href: hrefFor({...base, sort: "balance-high"}), active: sort === "balance-high"},
            {label: "Order value", href: hrefFor({...base, sort: "order-value"}), active: sort === "order-value"},
          ]}
        />

        <details className="rounded-2xl border border-[#102015]/10 bg-white p-4 text-[#102015] shadow-sm">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">Create customer</h2>
              <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">Open</span>
            </div>
          </summary>

        <form
          action={createCustomerAction}
          className="mt-5"
        >

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Customer name
              <input
                name="name"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Lagos restaurant buyer"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Phone
              <input
                name="phone"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="+234..."
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Email
              <input
                name="email"
                type="email"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="optional"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Receipt email
              <input
                name="receiptEmail"
                type="email"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="optional receipt address"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Buyer type
              <select
                name="buyerType"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                defaultValue="Restaurant"
              >
                {buyerTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Location
              <input
                name="location"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Yaba, Lagos"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Credit limit
              <input
                name="creditLimit"
                type="number"
                min="0"
                defaultValue="0"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Outstanding balance
              <input
                name="outstandingBalance"
                type="number"
                min="0"
                defaultValue="0"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Account status
              <select
                name="accountStatus"
                defaultValue="Manual WhatsApp"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Manual WhatsApp</option>
                <option>Approved recurring buyer</option>
                <option>Credit review</option>
                <option>Account login pending</option>
                <option>Account login ready</option>
                <option>Paused</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Status
              <select
                name="status"
                defaultValue="Active"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              >
                <option>Active</option>
                <option>Needs review</option>
                <option>Paused</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Payment terms
              <input
                name="paymentTerms"
                defaultValue="Full payment before order allocation"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-[#f7f5ec] px-4 py-3 text-sm font-semibold md:col-span-2">
              <input name="accountLoginReady" type="checkbox" className="h-4 w-4" />
              Mark buyer as login-ready when proper auth is connected
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
          >
            Save customer
          </button>
        </form>
        </details>

        <div className="overflow-x-auto rounded-2xl border border-[#102015]/10 bg-white shadow-sm">
          <table className="min-w-[1100px] divide-y divide-[#102015]/10 text-sm">
            <thead className="bg-[#f3f8ef] text-left text-xs uppercase tracking-[0.18em] text-[#405348]">
              <tr>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Buyer type</th>
                <th className="px-5 py-4 font-semibold">Location</th>
                <th className="px-5 py-4 font-semibold">Account</th>
                <th className="px-5 py-4 font-semibold">Credit</th>
                <th className="px-5 py-4 font-semibold">Balance</th>
                <th className="px-5 py-4 font-semibold">Receipts</th>
                <th className="px-5 py-4 font-semibold">Orders</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#102015]/10">
              {sorted.map((customer) => {
                const receiptTotal = customer.receipts.reduce(
                  (sum, receipt) => sum + receipt.amount,
                  0,
                );

                return (
                  <tr key={customer.id} className="text-[#405348]">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="font-semibold text-[#102015] underline-offset-4 hover:underline"
                      >
                        {customer.name}
                      </Link>
                      <div className="text-xs text-[#587063]">{customer.phone}</div>
                      <div className="text-xs text-[#587063]">
                        {customer.receiptEmail || customer.email || "No receipt email"}
                      </div>
                    </td>
                    <td className="px-5 py-4">{customer.buyerType}</td>
                    <td className="px-5 py-4">{customer.location || "Not set"}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold">{customer.accountStatus}</div>
                      <div className="text-xs text-[#587063]">
                        {customer.accountLoginReady ? "Login ready" : "Manual account"}
                      </div>
                    </td>
                    <td className="px-5 py-4">{money(customer.creditLimit)}</td>
                    <td className="px-5 py-4">{money(customer.outstandingBalance)}</td>
                    <td className="px-5 py-4">{money(receiptTotal)}</td>
                    <td className="px-5 py-4">{customer.orders.length}</td>
                    <td className="px-5 py-4">
                      <AdminStatusPill tone={adminToneFromStatus(customer.status)}>
                        {customer.status}
                      </AdminStatusPill>
                    </td>
                  </tr>
                );
              })}

              {!sorted.length ? (
                <tr>
                  <td className="px-5 py-8 text-center text-[#587063]" colSpan={9}>
                    No customers match this view.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}
