import Link from "next/link";
import {AdminPage} from "@/components/portal/AdminPage";
import {createWhatsAppAssistedOrderAction} from "@/actions/createAdminRecords";
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

export default async function WhatsAppAssistedOrderPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();

  const params = searchParams ? await searchParams : {};
  const error = typeof params.error === "string" ? params.error : "";

  const products = await prisma.product.findMany({
    where: {
      status: "Active",
    },
    orderBy: [{category: "asc"}, {name: "asc"}],
  });

  const availableProducts = products.filter((product) =>
    ["available", "in stock", "active"].includes(product.availability.toLowerCase())
  );

  return (
    <AdminPage
      title="WhatsApp order"
      subtitle="Create a database order from a WhatsApp buyer conversation using live product prices."
    >
      {error ? (
        <section className="rounded-[2rem] border border-[#d9471f]/30 bg-[#fff4ef] p-5 text-sm font-bold text-[#9b2f12]">
          {error === "missing-phone"
            ? "Enter the buyer WhatsApp phone number."
            : error === "no-items"
              ? "Select at least one product quantity."
              : "The order could not be created. Check the form and try again."}
        </section>
      ) : null}

      <form action={createWhatsAppAssistedOrderAction} className="grid gap-6">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
                Buyer matching
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#102015]">
                WhatsApp buyer details
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
                The phone number is used to match an approved buyer account or buyer contact. If matched, the order will appear in the buyer portal automatically.
              </p>
            </div>

            <Link
              href="/admin/buyer-access"
              className="rounded-full border border-[#102015]/15 bg-white px-4 py-2 text-sm font-black text-[#102015] hover:bg-[#f3f8ef]"
            >
              Buyer access
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-[#405348]">
              WhatsApp phone
              <input
                name="whatsappPhone"
                required
                className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                placeholder="+234..."
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#405348]">
              Buyer name if unmatched
              <input
                name="buyerName"
                className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                placeholder="Optional for new WhatsApp buyer"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#405348]">
              Buyer type if unmatched
              <select
                name="buyerType"
                defaultValue="WhatsApp buyer"
                className="rounded-2xl border border-[#102015]/15 bg-white px-4 py-3 text-[#102015]"
              >
                <option>WhatsApp buyer</option>
                <option>Restaurant</option>
                <option>Retailer</option>
                <option>Market trader</option>
                <option>Food processor</option>
                <option>Household buyer</option>
                <option>Institutional buyer</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#405348]">
              Delivery method
              <select
                name="deliveryMethod"
                defaultValue="Delivery"
                className="rounded-2xl border border-[#102015]/15 bg-white px-4 py-3 text-[#102015]"
              >
                <option>Delivery</option>
                <option>Pickup</option>
                <option>Buyer-arranged logistics</option>
                <option>OneFarmTech arranged</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            Product list
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#102015]">
            Select available products
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#405348]">
            Enter quantities for products selected during the WhatsApp conversation. Prices are pulled from the product catalogue and stored as a snapshot on the order.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f7f5ec] text-[#405348]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Product</th>
                  <th className="px-5 py-4 font-semibold">Category</th>
                  <th className="px-5 py-4 font-semibold">Unit</th>
                  <th className="px-5 py-4 font-semibold">Price</th>
                  <th className="px-5 py-4 font-semibold">Availability</th>
                  <th className="px-5 py-4 font-semibold">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {availableProducts.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-[#405348]" colSpan={6}>
                      No available products. Add active, available products before creating WhatsApp orders.
                    </td>
                  </tr>
                ) : (
                  availableProducts.map((product) => (
                    <tr key={product.id} className="border-b border-[#102015]/10">
                      <td className="px-5 py-4">
                        <p className="font-black text-[#102015]">{product.name}</p>
                        <p className="text-xs text-[#405348]">{product.grade}</p>
                      </td>
                      <td className="px-5 py-4 text-[#405348]">{product.category}</td>
                      <td className="px-5 py-4 text-[#405348]">{product.unit}</td>
                      <td className="px-5 py-4 font-black text-[#102015]">
                        {formatNaira(product.basePrice)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#f3f8ef] px-3 py-1 text-xs font-black text-[#1f7a3f]">
                          {product.availability}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <input
                          name={`quantity_${product.id}`}
                          type="number"
                          min="0"
                          step="1"
                          className="w-28 rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1f7a3f]">
            Fees and delivery
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#102015]">
            Payment and fulfilment details
          </h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-[#405348]">
              Delivery fee
              <input
                name="deliveryFee"
                inputMode="numeric"
                className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                placeholder="0"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#405348]">
              Service fee
              <input
                name="serviceFee"
                inputMode="numeric"
                className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                placeholder="0"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#405348]">
              Discount
              <input
                name="discountAmount"
                inputMode="numeric"
                className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                placeholder="0"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#405348]">
              Delivery area
              <input
                name="deliveryArea"
                className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                placeholder="e.g. Lekki Phase 1"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#405348] lg:col-span-2">
              Delivery address
              <textarea
                name="deliveryAddress"
                rows={3}
                className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                placeholder="Delivery address or pickup note"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#405348] lg:col-span-2">
              Delivery note
              <textarea
                name="deliveryNote"
                rows={3}
                className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                placeholder="Gate code, preferred time, contact on arrival..."
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[#405348] lg:col-span-2">
              Internal admin note
              <textarea
                name="adminNote"
                rows={3}
                className="rounded-2xl border border-[#102015]/15 px-4 py-3 text-[#102015]"
                placeholder="Any internal context from the WhatsApp conversation"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#102015] p-6 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Create WhatsApp order</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/75">
                This will create the order, line items, payment request, delivery placeholder and buyer message evidence where the phone matches a buyer account.
              </p>
            </div>

            <button
              type="submit"
              className="rounded-full bg-white px-6 py-3 text-sm font-black text-[#102015] shadow-sm hover:bg-[#f3f8ef]"
              disabled={availableProducts.length === 0}
            >
              Create order
            </button>
          </div>
        </section>
      </form>
    </AdminPage>
  );
}
