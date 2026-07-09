import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import {
  AdminCompactMetric,
  AdminStatusPill,
  AdminViewBar,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    date?: string;
    sort?: string;
  }>;
};

function money(value: number) {
  return `₦${value.toLocaleString()}`;
}

function hrefFor(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/admin/buyer-accounts?${query}` : "/admin/buyer-accounts";
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

export default async function BuyerAccountsPage({searchParams}: PageProps) {
  const params = await searchParams;
  const status = params?.status || "all";
  const date = params?.date || "all";
  const sort = params?.sort || "newest";

  const customers = await prisma.customer.findMany({
    orderBy: {createdAt: "desc"},
    include: {
      orders: {select: {id: true, estimatedTotal: true, paymentStatus: true, createdAt: true}},
      receipts: {select: {id: true, amount: true, status: true}},
    },
  });

  const accountReady = customers.filter((customer) => customer.accountLoginReady).length;
  const approved = customers.filter((customer) => customer.accountStatus.toLowerCase().includes("approved")).length;
  const totalCreditLimit = customers.reduce((sum, customer) => sum + customer.creditLimit, 0);
  const outstandingBalance = customers.reduce((sum, customer) => sum + customer.outstandingBalance, 0);

  const filtered = customers.filter((customer) => {
    const key = `${customer.accountStatus} ${customer.status}`.toLowerCase();
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

  const base = {status, date, sort};

  return (
    <AdminPageShell
      title="Buyer accounts"
      description="Approved buyers, credit exposure, balances and login readiness."
    >
      <div className="grid gap-5">
        <section className="grid gap-3 md:grid-cols-4">
          <AdminCompactMetric label="Login ready" value={String(accountReady)} tone="green" href={hrefFor({...base, status: "login-ready"})} />
          <AdminCompactMetric label="Approved" value={String(approved)} tone="green" href={hrefFor({...base, status: "approved"})} />
          <AdminCompactMetric label="Credit limit" value={money(totalCreditLimit)} tone="blue" />
          <AdminCompactMetric label="Outstanding" value={money(outstandingBalance)} tone={outstandingBalance > 0 ? "amber" : "neutral"} />
        </section>

        <AdminViewBar
          title="Buyer controls"
          description={`${sorted.length} buyer account${sorted.length === 1 ? "" : "s"} shown.`}
          filterOptions={[
            {label: "All", href: hrefFor({...base, status: "all"}), active: status === "all"},
            {label: "Approved", href: hrefFor({...base, status: "approved"}), active: status === "approved"},
            {label: "Login ready", href: hrefFor({...base, status: "login-ready"}), active: status === "login-ready"},
            {label: "Credit review", href: hrefFor({...base, status: "credit"}), active: status === "credit"},
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

        <section className="overflow-hidden rounded-2xl border border-[#102015]/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead className="bg-[#f3f8ef] text-xs uppercase tracking-[0.14em] text-[#405348]">
                <tr>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Credit</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Receipts</th>
                  <th className="px-4 py-3">Terms</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((customer) => {
                  const orderTotal = customer.orders.reduce((sum, order) => sum + order.estimatedTotal, 0);
                  const receiptTotal = customer.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

                  return (
                    <tr key={customer.id} className="border-t border-[#102015]/10 text-[#405348]">
                      <td className="px-4 py-3">
                        <Link href={`/admin/customers/${customer.id}`} className="font-black text-[#102015] underline-offset-4 hover:underline">
                          {customer.name}
                        </Link>
                        <p className="text-xs">{customer.phone}</p>
                      </td>
                      <td className="px-4 py-3">{customer.buyerType}</td>
                      <td className="px-4 py-3">
                        <AdminStatusPill tone={adminToneFromStatus(customer.accountStatus)}>
                          {customer.accountStatus}
                        </AdminStatusPill>
                        <p className="mt-1 text-xs">{customer.accountLoginReady ? "Login ready" : "Manual"}</p>
                      </td>
                      <td className="px-4 py-3 font-black text-[#102015]">{money(customer.creditLimit)}</td>
                      <td className="px-4 py-3 font-black text-[#102015]">{money(customer.outstandingBalance)}</td>
                      <td className="px-4 py-3">
                        <p className="font-black text-[#102015]">{customer.orders.length}</p>
                        <p className="text-xs">{money(orderTotal)}</p>
                      </td>
                      <td className="px-4 py-3">{money(receiptTotal)}</td>
                      <td className="max-w-[18rem] truncate px-4 py-3">{customer.paymentTerms}</td>
                    </tr>
                  );
                })}

                {!sorted.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-[#587063]" colSpan={8}>
                      No buyer accounts match this view.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
