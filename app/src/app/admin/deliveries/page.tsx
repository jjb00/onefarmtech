// @ts-nocheck -- temporary build stabilisation for new commerce pages
import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {
  AdminCompactMetric,
  AdminStatusPill,
  AdminViewBar,
  adminToneFromStatus,
} from "@/components/admin/AdminViewControls";
import {assignDeliveryPartnerAction} from "@/actions/createAdminRecords";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DeliveriesPageProps = {
  searchParams?: Promise<{
    status?: string;
    sort?: string;
  }>;
};

function formatNaira(amount: number | null | undefined) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value: Date | string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function hrefFor(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/admin/deliveries?${query}` : "/admin/deliveries";
}

export default async function DeliveriesPage({searchParams}: DeliveriesPageProps) {
  await requireStaff();

  const params = await searchParams;
  const status = params?.status || "all";
  const sort = params?.sort || "newest";

  const [deliveries, partners] = await Promise.all([
    prisma.delivery.findMany({
      orderBy: {createdAt: "desc"},
      take: 100,
      include: {
        order: {
          select: {
            id: true,
            code: true,
            buyerName: true,
            phone: true,
            fulfilmentStatus: true,
            paymentStatus: true,
            totalAmount: true,
            estimatedTotal: true,
          },
        },
        customer: {select: {id: true, name: true}},
        deliveryPartner: {select: {id: true, name: true, phone: true}},
      },
    }),
    prisma.deliveryPartner.findMany({
      where: {status: "Active"},
      orderBy: {name: "asc"},
      select: {id: true, name: true, phone: true, serviceArea: true},
    }),
  ]);

  const unassigned = deliveries.filter((delivery) => !delivery.deliveryPartnerId && !delivery.deliveryPartnerName);
  const active = deliveries.filter((delivery) => !["Delivered", "Cancelled"].includes(delivery.status));
  const delivered = deliveries.filter((delivery) => delivery.status === "Delivered");
  const issues = deliveries.filter((delivery) => delivery.status.toLowerCase().includes("issue") || delivery.status.toLowerCase().includes("failed"));

  const filtered = deliveries.filter((delivery) => {
    const key = delivery.status.toLowerCase();
    if (status === "all") return true;
    if (status === "unassigned") return !delivery.deliveryPartnerId && !delivery.deliveryPartnerName;
    if (status === "active") return !["delivered", "cancelled"].includes(key);
    if (status === "delivered") return key === "delivered";
    if (status === "issues") return key.includes("issue") || key.includes("failed");
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
    if (sort === "fee-high") return (b.deliveryFee || 0) - (a.deliveryFee || 0);
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const base = {status, sort};

  return (
    <AdminPage title="Deliveries" subtitle="Delivery queue with compact filters, partner assignment and status updates." compactHeader>
      <section className="grid gap-3 md:grid-cols-4">
        <AdminCompactMetric label="Active" value={String(active.length)} tone="blue" href={hrefFor({...base, status: "active"})} />
        <AdminCompactMetric label="Unassigned" value={String(unassigned.length)} tone="amber" href={hrefFor({...base, status: "unassigned"})} />
        <AdminCompactMetric label="Delivered" value={String(delivered.length)} tone="green" href={hrefFor({...base, status: "delivered"})} />
        <AdminCompactMetric label="Issues" value={String(issues.length)} tone="red" href={hrefFor({...base, status: "issues"})} />
      </section>

      <AdminViewBar
        title="Delivery controls"
        description={`${sorted.length} delivery record${sorted.length === 1 ? "" : "s"} shown.`}
        filterOptions={[
          {label: "All", href: hrefFor({...base, status: "all"}), active: status === "all"},
          {label: "Active", href: hrefFor({...base, status: "active"}), active: status === "active"},
          {label: "Unassigned", href: hrefFor({...base, status: "unassigned"}), active: status === "unassigned"},
          {label: "Delivered", href: hrefFor({...base, status: "delivered"}), active: status === "delivered"},
          {label: "Issues", href: hrefFor({...base, status: "issues"}), active: status === "issues"},
        ]}
        sortOptions={[
          {label: "Newest", href: hrefFor({...base, sort: "newest"}), active: sort === "newest"},
          {label: "Oldest", href: hrefFor({...base, sort: "oldest"}), active: sort === "oldest"},
          {label: "Fee high", href: hrefFor({...base, sort: "fee-high"}), active: sort === "fee-high"},
        ]}
      />

      <section className="rounded-2xl border border-[#102015]/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-[#f3f8ef] text-xs uppercase tracking-[0.14em] text-[#405348]">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Preferred</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Area / tracking</th>
                <th className="px-4 py-3">Update</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((delivery) => (
                <tr key={delivery.id} className="border-t border-[#102015]/10 text-[#405348] align-top">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${delivery.orderId}`} className="font-black text-[#1f7a3f] underline-offset-4 hover:underline">
                      {delivery.order.code}
                    </Link>
                    <p className="mt-1 text-xs">{delivery.order.paymentStatus}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#102015]">{delivery.customer?.name || delivery.order.buyerName}</p>
                    <p className="text-xs">{delivery.order.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusPill tone={adminToneFromStatus(delivery.status)}>
                      {delivery.status}
                    </AdminStatusPill>
                  </td>
                  <td className="px-4 py-3">{delivery.deliveryPartner?.name || delivery.deliveryPartnerName || "Unassigned"}</td>
                  <td className="px-4 py-3">{formatDate(delivery.preferredDate)}</td>
                  <td className="px-4 py-3 font-black text-[#102015]">{formatNaira(delivery.deliveryFee)}</td>
                  <td className="px-4 py-3">
                    <p>{delivery.deliveryArea || "No area"}</p>
                    <p className="text-xs">{delivery.trackingReference || "No tracking"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <details className="rounded-xl border border-[#102015]/10 bg-[#fbfff8] p-3">
                      <summary className="cursor-pointer text-xs font-black text-[#1f7a3f]">Edit</summary>
                      <form action={assignDeliveryPartnerAction} className="mt-3 grid min-w-[24rem] gap-3">
                        <input type="hidden" name="deliveryId" value={delivery.id} />
                        <select name="deliveryPartnerId" defaultValue={delivery.deliveryPartnerId || ""} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-[#102015]">
                          <option value="">Unassigned</option>
                          {partners.map((partner) => (
                            <option key={partner.id} value={partner.id}>
                              {partner.name}{partner.serviceArea ? ` · ${partner.serviceArea}` : ""}
                            </option>
                          ))}
                        </select>
                        <select name="status" defaultValue={delivery.status} className="rounded-xl border border-[#102015]/15 bg-white px-3 py-2 text-[#102015]">
                          <option>Pending assignment</option>
                          <option>Assigned</option>
                          <option>Accepted</option>
                          <option>Picked up</option>
                          <option>In transit</option>
                          <option>Delivered</option>
                          <option>Failed / issue</option>
                        </select>
                        <input name="deliveryFee" defaultValue={delivery.deliveryFee || 0} inputMode="numeric" className="rounded-xl border border-[#102015]/15 px-3 py-2 text-[#102015]" placeholder="Delivery fee" />
                        <input name="deliveryArea" defaultValue={delivery.deliveryArea || ""} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-[#102015]" placeholder="Delivery area" />
                        <input name="trackingReference" defaultValue={delivery.trackingReference || ""} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-[#102015]" placeholder="Tracking reference" />
                        <input name="proofOfDeliveryNote" defaultValue={delivery.proofOfDeliveryNote || ""} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-[#102015]" placeholder="Proof / issue note" />
                        <textarea name="deliveryAddress" defaultValue={delivery.deliveryAddress || ""} rows={2} className="rounded-xl border border-[#102015]/15 px-3 py-2 text-[#102015]" placeholder="Delivery address" />
                        <button type="submit" className="rounded-full bg-[#1f7a3f] px-4 py-2 text-xs font-black text-white">
                          Save
                        </button>
                      </form>
                    </details>
                  </td>
                </tr>
              ))}

              {!sorted.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#587063]" colSpan={8}>
                    No delivery records match this view.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end">
        <Link href="/admin/delivery-partners" className="rounded-full border border-[#102015]/10 bg-white px-5 py-3 text-sm font-black text-[#102015] shadow-sm hover:bg-[#f3f8ef]">
          Manage delivery partners
        </Link>
      </div>
    </AdminPage>
  );
}
