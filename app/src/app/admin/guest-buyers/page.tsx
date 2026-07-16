import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {
  AdminCompactMetric,
  AdminStatusPill,
  AdminViewBar,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GuestBuyerGroup = {
  phone: string;
  buyerName: string;
  buyerType: string;
  orderCount: number;
  totalSpend: number;
  latestOrderAt: Date;
  sources: Set<string>;
  orders: Array<{
    id: string;
    code: string;
    buyerName: string;
    buyerType: string;
    source: string;
    orderType: string;
    totalAmount: number;
    estimatedTotal: number;
    paymentStatus: string;
    fulfilmentStatus: string;
    createdAt: Date;
  }>;
};

function formatNaira(amount: number | null | undefined) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function recommendation(group: GuestBuyerGroup) {
  if (group.orderCount >= 3 || group.totalSpend >= 500000) {
    return {
      label: "Account candidate",
      className: "bg-[#eef6ea] text-[#1f7a3f]",
      note: "Repeat or high-value guest. Consider linking to an existing buyer or creating an account if they need history, receipts or payment terms.",
    };
  }

  if (group.orderCount === 2) {
    return {
      label: "Watch",
      className: "bg-[#fff6d6] text-[#7a4a00]",
      note: "Second order from this phone. Keep as guest unless they become regular or request account access.",
    };
  }

  return {
    label: "Guest",
    className: "bg-[#f1eee4] text-[#405348]",
    note: "Likely one-off or occasional buyer. No account needed unless they return or request one.",
  };
}

type GuestBuyersPageProps = {
  embedded?: boolean;
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
  return query ? `/admin/guest-buyers?${query}` : "/admin/guest-buyers";
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

export default async function GuestBuyersPage({searchParams, embedded}: GuestBuyersPageProps) {
  await requireStaff();

  const params = await searchParams;
  const status = params?.status || "all";
  const date = params?.date || "all";
  const sort = params?.sort || "value";

  const orders = await prisma.order.findMany({
    where: {
      customerId: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 500,
    select: {
      id: true,
      code: true,
      buyerName: true,
      buyerType: true,
      phone: true,
      sourcePhone: true,
      source: true,
      orderType: true,
      totalAmount: true,
      estimatedTotal: true,
      paymentStatus: true,
      fulfilmentStatus: true,
      createdAt: true,
    },
  });

  const groups = new Map<string, GuestBuyerGroup>();

  for (const order of orders) {
    const phone = order.sourcePhone || order.phone || "Unknown phone";
    const existing = groups.get(phone);
    const amount = order.totalAmount || order.estimatedTotal || 0;

    if (!existing) {
      groups.set(phone, {
        phone,
        buyerName: order.buyerName,
        buyerType: order.buyerType,
        orderCount: 1,
        totalSpend: amount,
        latestOrderAt: order.createdAt,
        sources: new Set([order.source || order.orderType || "Unknown"]),
        orders: [order],
      });
    } else {
      existing.orderCount += 1;
      existing.totalSpend += amount;
      existing.sources.add(order.source || order.orderType || "Unknown");
      existing.orders.push(order);
      if (order.createdAt > existing.latestOrderAt) {
        existing.latestOrderAt = order.createdAt;
        existing.buyerName = order.buyerName;
        existing.buyerType = order.buyerType;
      }
    }
  }

  const guestGroups = Array.from(groups.values());

  const filteredGroups = guestGroups.filter((group) => {
    const rec = recommendation(group);
    const statusMatch =
      status === "all" ||
      rec.label.toLowerCase().includes(status) ||
      group.buyerType.toLowerCase().includes(status);
    return statusMatch && inDateRange(group.latestOrderAt, date);
  });

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    if (sort === "orders") return b.orderCount - a.orderCount;
    if (sort === "latest") return b.latestOrderAt.getTime() - a.latestOrderAt.getTime();
    if (sort === "name") return a.buyerName.localeCompare(b.buyerName);
    return b.totalSpend - a.totalSpend;
  });

  const accountCandidates = guestGroups.filter(
    (group) => group.orderCount >= 3 || group.totalSpend >= 500000
  );

  const totalGuestSpend = guestGroups.reduce((sum, group) => sum + group.totalSpend, 0);
  const base = {status, date, sort};

  return (
    <AdminPage
      title="Guest buyers"
      subtitle="Unlinked WhatsApp, event and one-off buyers grouped by phone number."
      embedded={embedded}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fff6d6] px-4 py-3 text-sm"><p>This is a bounded recent view of up to 500 unlinked orders. Guest identity is grouped by the stored phone value.</p><Link href="/admin/customers?view=guests" className="font-black text-[#1f7a3f]">Open Buyers workspace</Link></div>
      <section className="grid gap-3 md:grid-cols-3">
        <AdminCompactMetric label="Guest phones" value={String(guestGroups.length)} tone="blue" />
        <AdminCompactMetric label="Guest value" value={formatNaira(totalGuestSpend)} tone="green" />
        <AdminCompactMetric label="Account candidates" value={String(accountCandidates.length)} tone="amber" href={hrefFor({...base, status: "account"})} />
      </section>

      <AdminViewBar
        title="Guest buyer controls"
        description={`${sortedGroups.length} guest buyer group${sortedGroups.length === 1 ? "" : "s"} shown.`}
        filterOptions={[
          {label: "All", href: hrefFor({...base, status: "all"}), active: status === "all"},
          {label: "Account candidates", href: hrefFor({...base, status: "account"}), active: status === "account"},
          {label: "Watch", href: hrefFor({...base, status: "watch"}), active: status === "watch"},
          {label: "Guest", href: hrefFor({...base, status: "guest"}), active: status === "guest"},
        ]}
        dateOptions={[
          {label: "All time", href: hrefFor({...base, date: "all"}), active: date === "all"},
          {label: "Today", href: hrefFor({...base, date: "today"}), active: date === "today"},
          {label: "7 days", href: hrefFor({...base, date: "week"}), active: date === "week"},
          {label: "This month", href: hrefFor({...base, date: "month"}), active: date === "month"},
          {label: "This year", href: hrefFor({...base, date: "year"}), active: date === "year"},
        ]}
        sortOptions={[
          {label: "Value", href: hrefFor({...base, sort: "value"}), active: sort === "value"},
          {label: "Orders", href: hrefFor({...base, sort: "orders"}), active: sort === "orders"},
          {label: "Latest", href: hrefFor({...base, sort: "latest"}), active: sort === "latest"},
          {label: "Name", href: hrefFor({...base, sort: "name"}), active: sort === "name"},
        ]}
      />

      <section className="rounded-2xl border border-[#102015]/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Guest intelligence
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              Unlinked buyer activity
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              Keep one-off buyers as guests. Convert only repeat, high-value or relationship buyers into accounts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/whatsapp-orders/new"
              className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
            >
              New WhatsApp order
            </Link>
            <Link
              href="/admin/buyer-account-requests"
              className="rounded-full border border-[#102015]/15 bg-white px-5 py-3 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
            >
              Buyer requests
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {guestGroups.length === 0 ? (
            <div className="rounded-2xl bg-[#f7f5ec] p-5 text-sm leading-7 text-[#405348]">
              No unlinked guest orders yet.
            </div>
          ) : (
            sortedGroups.map((group) => {
              const rec = recommendation(group);

              return (
                <article key={group.phone} className="rounded-2xl border border-[#102015]/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <AdminStatusPill tone={adminToneFromStatus(rec.label)}>
                          {rec.label}
                        </AdminStatusPill>
                        <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black text-[#405348]">
                          {Array.from(group.sources).join(", ")}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black text-[#102015]">
                        {group.buyerName || "Guest buyer"}
                      </h3>
                      <p className="mt-1 text-sm leading-7 text-[#405348]">
                        {group.phone} · {group.buyerType || "Guest"} · Latest {formatDate(group.latestOrderAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black text-[#102015]">
                        {formatNaira(group.totalSpend)}
                      </p>
                      <p className="text-sm text-[#405348]">
                        {group.orderCount} order{group.orderCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <details className="mt-4 rounded-xl border border-[#102015]/10 bg-[#f7f5ec] p-3">
                    <summary className="cursor-pointer text-xs font-black text-[#102015]">Recommendation</summary>
                    <p className="mt-2 text-sm leading-6 text-[#405348]">{rec.note}</p>
                  </details>

                  <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-[#f7f5ec] text-[#405348]">
                        <tr>
                          <th className="px-5 py-4 font-semibold">Order</th>
                          <th className="px-5 py-4 font-semibold">Date</th>
                          <th className="px-5 py-4 font-semibold">Value</th>
                          <th className="px-5 py-4 font-semibold">Payment</th>
                          <th className="px-5 py-4 font-semibold">Fulfilment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.orders.map((order) => (
                          <tr key={order.id} className="border-b border-[#102015]/10">
                            <td className="px-5 py-4">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="font-black text-[#1f7a3f] underline underline-offset-4"
                              >
                                {order.code}
                              </Link>
                            </td>
                            <td className="px-5 py-4 text-[#405348]">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-5 py-4 font-black text-[#102015]">
                              {formatNaira(order.totalAmount || order.estimatedTotal)}
                            </td>
                            <td className="px-5 py-4 text-[#405348]">
                              {order.paymentStatus}
                            </td>
                            <td className="px-5 py-4 text-[#405348]">
                              {order.fulfilmentStatus}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </AdminPage>
  );
}
