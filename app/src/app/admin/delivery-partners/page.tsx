import {AdminPage} from "@/components/portal/AdminPage";
import {
  createDeliveryPartnerAction,
  updateDeliveryPartnerStatusAction,
} from "@/actions/createAdminRecords";
import {requireStaff} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DeliveryPartnersPage() {
  await requireStaff();

  const partners = await prisma.deliveryPartner.findMany({
    orderBy: {createdAt: "desc"},
    include: {
      deliveries: {
        select: {id: true, status: true},
      },
    },
  });

  return (
    <AdminPage
      title="Delivery partners"
      subtitle="Manage logistics partners used for order fulfilment and delivery assignment."
    >
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
          Add partner
        </p>
        <h2 className="mt-2 text-2xl font-black text-[#102015]">
          New delivery partner
        </h2>

        <form action={createDeliveryPartnerAction} className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-[#405348]">
            Partner name
            <input
              name="name"
              required
              className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
              placeholder="e.g. Lagos Fresh Logistics"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[#405348]">
            Contact name
            <input
              name="contactName"
              className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
              placeholder="Operations contact"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[#405348]">
            Phone / WhatsApp
            <input
              name="phone"
              className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
              placeholder="+234..."
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[#405348]">
            Email
            <input
              name="email"
              type="email"
              className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
              placeholder="dispatch@example.com"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[#405348] lg:col-span-2">
            Service area
            <input
              name="serviceArea"
              className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
              placeholder="e.g. Lagos Island, Lekki, Ikeja"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[#405348] lg:col-span-2">
            Notes
            <textarea
              name="notes"
              rows={3}
              className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
              placeholder="Capacity, vehicle type, pricing notes, reliability notes..."
            />
          </label>

          <div className="lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-[#1f7a3f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#155c2f]"
            >
              Add delivery partner
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
              Partner list
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#102015]">
              Active and paused partners
            </h2>
          </div>
          <span className="rounded-full bg-[#f3f8ef] px-4 py-2 text-sm font-black text-[#1f7a3f]">
            {partners.length} partners
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f7f5ec] text-[#405348]">
              <tr>
                <th className="px-5 py-4 font-semibold">Partner</th>
                <th className="px-5 py-4 font-semibold">Contact</th>
                <th className="px-5 py-4 font-semibold">Service area</th>
                <th className="px-5 py-4 font-semibold">Deliveries</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Update</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#405348]" colSpan={6}>
                    No delivery partners added yet.
                  </td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id} className="border-b border-[#102015]/10">
                    <td className="px-5 py-4">
                      <p className="font-black text-[#102015]">{partner.name}</p>
                      <p className="text-xs text-[#405348]">{partner.notes || "No notes"}</p>
                    </td>
                    <td className="px-5 py-4 text-[#405348]">
                      <p>{partner.contactName || "—"}</p>
                      <p>{partner.phone || partner.email || "No contact"}</p>
                    </td>
                    <td className="px-5 py-4 text-[#405348]">
                      {partner.serviceArea || "Not set"}
                    </td>
                    <td className="px-5 py-4 text-[#405348]">
                      {partner.deliveries.length}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black text-[#1f7a3f]">
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <form action={updateDeliveryPartnerStatusAction} className="flex gap-2">
                        <input type="hidden" name="id" value={partner.id} />
                        <select
                          name="status"
                          defaultValue={partner.status}
                          className="rounded-full border border-[#102015]/15 bg-white px-3 py-2 text-sm font-bold text-[#102015]"
                        >
                          <option>Active</option>
                          <option>Paused</option>
                          <option>Archived</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-full border border-[#102015]/15 px-4 py-2 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
                        >
                          Save
                        </button>
                      </form>
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
