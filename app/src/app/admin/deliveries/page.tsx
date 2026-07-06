import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export default async function DeliveriesPage() {
  await requireStaff();

  const deliveries = await prisma.delivery.findMany({
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
        },
      },
      customer: {
        select: {
          id: true,
          fullName: true,
        },
      },
      deliveryPartner: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return (
    <AdminPage
      title="Deliveries"
      subtitle="Track delivery assignments, partner status, delivery fees and proof-of-delivery notes."
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Delivery operations
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              Delivery records
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
              Deliveries will appear here when orders are assigned for fulfilment.
            </p>
          </div>

          <Link
            href="/admin/delivery-partners"
            className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
          >
            Manage partners
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f7f5ec] text-[#405348]">
              <tr>
                <th className="px-5 py-4 font-semibold">Order</th>
                <th className="px-5 py-4 font-semibold">Buyer</th>
                <th className="px-5 py-4 font-semibold">Partner</th>
                <th className="px-5 py-4 font-semibold">Fee</th>
                <th className="px-5 py-4 font-semibold">Preferred date</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#405348]" colSpan={6}>
                    No delivery records yet. Delivery records should be created when an order is assigned for fulfilment.
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => (
                  <tr key={delivery.id} className="border-b border-[#102015]/10">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/orders/${delivery.orderId}`}
                        className="font-black text-[#1f7a3f] underline underline-offset-4"
                      >
                        {delivery.order.code}
                      </Link>
                      <p className="text-xs text-[#405348]">
                        {delivery.order.paymentStatus} · {delivery.order.fulfilmentStatus}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-[#405348]">
                      <p>{delivery.customer?.fullName || delivery.order.buyerName}</p>
                      <p className="text-xs">{delivery.order.phone}</p>
                    </td>
                    <td className="px-5 py-4 text-[#405348]">
                      <p>{delivery.deliveryPartner?.name || delivery.deliveryPartnerName || "Unassigned"}</p>
                      <p className="text-xs">
                        {delivery.deliveryPartner?.phone || delivery.deliveryPartnerPhone || "No contact"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-[#405348]">
                      {formatNaira(delivery.deliveryFee)}
                    </td>
                    <td className="px-5 py-4 text-[#405348]">
                      {formatDate(delivery.preferredDate)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black text-[#1f7a3f]">
                        {delivery.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminPage>
  );
}
