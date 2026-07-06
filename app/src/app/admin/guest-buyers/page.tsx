import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
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

export default async function GuestBuyersPage() {
  await requireStaff();

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

  const guestGroups = Array.from(groups.values()).sort((a, b) => {
    if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
    return b.totalSpend - a.totalSpend;
  });

  const accountCandidates = guestGroups.filter(
    (group) => group.orderCount >= 3 || group.totalSpend >= 500000
  );

  const totalGuestSpend = guestGroups.reduce((sum, group) => sum + group.totalSpend, 0);

  return (
    <AdminPage
      title="Guest buyers"
      subtitle="Unlinked WhatsApp, event and one-off buyers grouped by phone number."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a7d55]">
            Guest phones
          </p>
          <p className="mt-3 text-3xl font-black text-[#102015]">{guestGroups.length}</p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a7d55]">
            Guest order value
          </p>
          <p className="mt-3 text-3xl font-black text-[#102015]">
            {formatNaira(totalGuestSpend)}
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a7d55]">
            Account candidates
          </p>
          <p className="mt-3 text-3xl font-black text-[#102015]">
            {accountCandidates.length}
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
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

        <div className="mt-6 grid gap-4">
          {guestGroups.length === 0 ? (
            <div className="rounded-2xl bg-[#f7f5ec] p-5 text-sm leading-7 text-[#405348]">
              No unlinked guest orders yet.
            </div>
          ) : (
            guestGroups.map((group) => {
              const rec = recommendation(group);

              return (
                <article key={group.phone} className="rounded-[1.5rem] border border-[#102015]/10 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${rec.className}`}>
                          {rec.label}
                        </span>
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

                  <p className="mt-4 rounded-2xl bg-[#f7f5ec] p-4 text-sm leading-7 text-[#405348]">
                    {rec.note}
                  </p>

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
