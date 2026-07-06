import {deliveryPartnerLogoutAction, updateDeliveryJobStatusAction} from "@/actions/createAdminRecords";
import {getCurrentDeliveryPartner} from "@/lib/currentDeliveryPartner";
import {prisma} from "@/lib/prisma";
import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  }).format(new Date(value));
}

export default async function DeliveryPartnerJobsPage() {
  const partner = await getCurrentDeliveryPartner();

  if (!partner) {
    redirect("/delivery-partner/login");
  }

  const deliveries = await prisma.delivery.findMany({
    where: {
      deliveryPartnerId: partner.id,
    },
    orderBy: {createdAt: "desc"},
    include: {
      order: {
        select: {
          code: true,
          buyerName: true,
          phone: true,
          paymentStatus: true,
          fulfilmentStatus: true,
          totalAmount: true,
          estimatedTotal: true,
          deliveryNote: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-[#f7f5ec] px-4 py-6 text-[#102015] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Delivery partner
              </p>
              <h1 className="mt-2 text-3xl font-black">{partner.name}</h1>
              <p className="mt-2 text-sm leading-7 text-[#405348]">
                Assigned delivery jobs and fulfilment updates.
              </p>
            </div>

            <form action={deliveryPartnerLogoutAction}>
              <button
                type="submit"
                className="rounded-full border border-[#102015]/15 bg-white px-5 py-3 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
              >
                Sign out
              </button>
            </form>
          </div>
        </section>

        {deliveries.length === 0 ? (
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">No assigned deliveries</h2>
            <p className="mt-2 text-sm leading-7 text-[#405348]">
              Delivery jobs assigned by OneFarmTech operations will appear here.
            </p>
          </section>
        ) : (
          deliveries.map((delivery) => (
            <article key={delivery.id} className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                    {delivery.status}
                  </p>
                  <h2 className="mt-2 text-2xl font-black">{delivery.order.code}</h2>
                  <p className="mt-2 text-sm leading-7 text-[#405348]">
                    {delivery.order.buyerName} · {delivery.order.phone}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-black">
                    {formatNaira(delivery.order.totalAmount || delivery.order.estimatedTotal)}
                  </p>
                  <p className="text-sm text-[#405348]">{delivery.order.paymentStatus}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 rounded-2xl bg-[#f7f5ec] p-5 text-sm text-[#405348] md:grid-cols-2">
                <p><span className="font-black text-[#102015]">Area:</span> {delivery.deliveryArea || "Not set"}</p>
                <p><span className="font-black text-[#102015]">Fee:</span> {formatNaira(delivery.deliveryFee)}</p>
                <p><span className="font-black text-[#102015]">Preferred date:</span> {formatDate(delivery.preferredDate)}</p>
                <p><span className="font-black text-[#102015]">Tracking:</span> {delivery.trackingReference || "Not set"}</p>
                <p className="md:col-span-2">
                  <span className="font-black text-[#102015]">Address:</span> {delivery.deliveryAddress || delivery.order.deliveryNote || "Not set"}
                </p>
              </div>

              <form action={updateDeliveryJobStatusAction} className="mt-5 grid gap-4 lg:grid-cols-[1fr_2fr_auto]">
                <input type="hidden" name="deliveryId" value={delivery.id} />

                <label className="grid gap-2 text-sm font-bold text-[#405348]">
                  Status
                  <select
                    name="status"
                    defaultValue={delivery.status}
                    className="rounded-2xl border border-[#102015]/15 bg-white px-4 py-3 text-[#102015]"
                  >
                    <option>Accepted</option>
                    <option>Picked up</option>
                    <option>In transit</option>
                    <option>Delivered</option>
                    <option>Failed / issue</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-bold text-[#405348]">
                  Proof / issue note
                  <input
                    name="proofOfDeliveryNote"
                    defaultValue={delivery.proofOfDeliveryNote || ""}
                    className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                    placeholder="Delivery confirmation or issue note"
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
                  >
                    Update
                  </button>
                </div>
              </form>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
