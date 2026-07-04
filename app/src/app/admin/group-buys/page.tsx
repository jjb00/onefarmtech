import AdminPageShell from "@/components/AdminPageShell";
import StatusBadge from "@/components/admin/StatusBadge";
import { getDbGroupBuys, getDbProducts } from "@/data/dbAdmin";
import {
  createGroupBuyAction,
  createGroupBuyReservationAction,
  updateGroupBuyAction,
} from "@/actions/groupBuys";
import { buyerTypes } from "@/constants/orderOptions";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "No close date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const groupBuyStatuses = ["Draft", "Open", "Minimum met", "Closed", "Cancelled"];
const groupBuyPaymentStatuses = [
  "Collecting payments",
  "Minimum payments met",
  "Fully paid",
  "Refund pending",
  "Refunded",
];
const groupBuyFulfilmentStatuses = [
  "Planning",
  "Allocation",
  "Awaiting harvest",
  "Packed",
  "Ready for pickup",
  "Completed",
  "Issue reported",
];

export default async function GroupBuysPage() {
  const [groupBuys, products] = await Promise.all([
    getDbGroupBuys(),
    getDbProducts(),
  ]);

  return (
    <AdminPageShell
      title="Group buys"
      description="Create and manage admin-led group buys, buyer reservations, payment collection, and fulfilment."
    >
      <div className="grid gap-8">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white">
            <p className="text-sm font-bold text-[#9ee6ad]">City group buys</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Public area-based group buys for buyers around a city, market, pickup point, or delivery route.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white">
            <p className="text-sm font-bold text-[#9ee6ad]">Private group buys</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Friends, neighbours, offices, churches, restaurant clusters, or retailer groups can request private buying groups.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white">
            <p className="text-sm font-bold text-[#9ee6ad]">Admin-reviewed</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              MVP group buys should be reviewed by admin before activation, payment collection, and fulfilment.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 text-white">
          <h2 className="text-2xl font-bold">Group-buy operating rules</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Confirm location and buyer group type.",
              "Set minimum quantity and payment rule.",
              "Track reservations against target quantity.",
              "Move to fulfilment only when admin approves allocation.",
            ].map((rule) => (
              <div key={rule} className="rounded-2xl bg-white/[0.05] p-4 text-sm leading-6 text-white/70">
                {rule}
              </div>
            ))}
          </div>
        </section>

        <form
          action={createGroupBuyAction}
          className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm"
        >
          <h2 className="text-2xl font-bold">Create group buy</h2>
          <p className="mt-2 text-sm text-[#405348]">
            Use this for admin-created bulk offers where buyers reserve slots before order allocation.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Group-buy title
              <input
                name="title"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="e.g. Weekend tomato bulk buy"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Existing product
              <select
                name="productId"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                defaultValue=""
              >
                <option value="">Manual item / no product link</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.grade} · {product.unit} · {formatNaira(product.basePrice)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Product name
              <input
                name="productName"
                required
                defaultValue="Tomatoes"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Grade
              <input
                name="grade"
                defaultValue="Grade A"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Unit
              <input
                name="unit"
                defaultValue="basket"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Unit price
              <input
                name="unitPrice"
                type="number"
                min="1"
                required
                defaultValue="0"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Minimum quantity
              <input
                name="minQuantity"
                type="number"
                min="0"
                defaultValue="0"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Target quantity
              <input
                name="targetQuantity"
                type="number"
                min="1"
                required
                defaultValue="20"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Closing date
              <input
                name="closingDate"
                type="date"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Pickup window
              <input
                name="pickupWindow"
                placeholder="e.g. Saturday 10am–2pm, Yaba"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Description
              <textarea
                name="description"
                className="min-h-24 rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="Explain the offer, payment rule, and pickup/delivery expectations."
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Admin note
              <textarea
                name="adminNote"
                className="min-h-20 rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#1f7a3f]"
                placeholder="Supplier, route, pricing, or quality notes."
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#155c2f]"
          >
            Create group buy
          </button>
        </form>

        <section className="grid gap-6">
          {groupBuys.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-white">
              <h2 className="text-2xl font-bold">No group buys yet</h2>
              <p className="mt-2 text-white/60">
                Create the first admin-led group buy above.
              </p>
            </div>
          ) : (
            groupBuys.map((groupBuy) => {
              const firstItem = groupBuy.items[0];
              const unitPrice = firstItem?.unitPrice || 0;
              const progress =
                groupBuy.targetQuantity > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (groupBuy.reservedQuantity / groupBuy.targetQuantity) * 100
                      )
                    )
                  : 0;
              const reservedValue = groupBuy.reservations.reduce(
                (sum, reservation) => sum + reservation.amount,
                0
              );

              return (
                <article
                  key={groupBuy.id}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-white"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#9ee6ad]">
                        {groupBuy.code}
                      </p>
                      <h2 className="mt-2 text-3xl font-black">{groupBuy.title}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
                        {groupBuy.description || "No description added."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={groupBuy.status} />
                      <StatusBadge status={groupBuy.paymentStatus} />
                      <StatusBadge status={groupBuy.fulfilmentStatus} />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-5">
                    <div className="rounded-2xl bg-white/[0.06] p-4">
                      <p className="text-sm text-white/45">Item</p>
                      <p className="mt-1 font-bold">
                        {firstItem?.name || "No item"} · {firstItem?.grade || "N/A"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.06] p-4">
                      <p className="text-sm text-white/45">Reserved</p>
                      <p className="mt-1 font-bold">
                        {groupBuy.reservedQuantity} / {groupBuy.targetQuantity} {groupBuy.unit}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.06] p-4">
                      <p className="text-sm text-white/45">Minimum</p>
                      <p className="mt-1 font-bold">
                        {groupBuy.minQuantity} {groupBuy.unit}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.06] p-4">
                      <p className="text-sm text-white/45">Reserved value</p>
                      <p className="mt-1 font-bold">{formatNaira(reservedValue)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.06] p-4">
                      <p className="text-sm text-white/45">Close / pickup</p>
                      <p className="mt-1 font-bold">{formatDate(groupBuy.closingDate)}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {groupBuy.pickupWindow || "No pickup window"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#9ee6ad]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-6 grid gap-6 xl:grid-cols-3">
                    <form
                      action={createGroupBuyReservationAction}
                      className="rounded-2xl bg-white p-5 text-[#102015]"
                    >
                      <input type="hidden" name="groupBuyId" value={groupBuy.id} />
                      <input type="hidden" name="unitPrice" value={unitPrice} />

                      <h3 className="text-xl font-bold">Add reservation</h3>

                      <div className="mt-4 grid gap-3">
                        <input
                          name="buyerName"
                          required
                          placeholder="Buyer name"
                          className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#1f7a3f]"
                        />
                        <input
                          name="phone"
                          required
                          placeholder="+234..."
                          className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#1f7a3f]"
                        />
                        <select
                          name="buyerType"
                          defaultValue="Individual"
                          className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#1f7a3f]"
                        >
                          {buyerTypes.map((type) => (
                            <option key={type}>{type}</option>
                          ))}
                        </select>
                        <input
                          name="quantity"
                          required
                          type="number"
                          min="1"
                          placeholder={`Quantity in ${groupBuy.unit}`}
                          className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#1f7a3f]"
                        />
                        <select
                          name="paymentStatus"
                          defaultValue="Unpaid"
                          className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#1f7a3f]"
                        >
                          <option>Unpaid</option>
                          <option>Deposit pending</option>
                          <option>Deposit paid</option>
                          <option>Fully paid</option>
                          <option>Refund pending</option>
                          <option>Refunded</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="mt-4 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white"
                      >
                        Save reservation
                      </button>
                    </form>

                    <form
                      action={updateGroupBuyAction}
                      className="rounded-2xl bg-white p-5 text-[#102015]"
                    >
                      <input type="hidden" name="groupBuyId" value={groupBuy.id} />

                      <h3 className="text-xl font-bold">Update group buy</h3>

                      <div className="mt-4 grid gap-3">
                        <select
                          name="status"
                          defaultValue={groupBuy.status}
                          className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#1f7a3f]"
                        >
                          {groupBuyStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>

                        <select
                          name="paymentStatus"
                          defaultValue={groupBuy.paymentStatus}
                          className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#1f7a3f]"
                        >
                          {groupBuyPaymentStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>

                        <select
                          name="fulfilmentStatus"
                          defaultValue={groupBuy.fulfilmentStatus}
                          className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#1f7a3f]"
                        >
                          {groupBuyFulfilmentStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>

                        <textarea
                          name="adminNote"
                          defaultValue={groupBuy.adminNote || ""}
                          className="min-h-24 rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#1f7a3f]"
                          placeholder="Admin note"
                        />
                      </div>

                      <button
                        type="submit"
                        className="mt-4 rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-bold text-white"
                      >
                        Save update
                      </button>
                    </form>

                    <div className="rounded-2xl bg-white/[0.06] p-5">
                      <h3 className="text-xl font-bold">Reservations</h3>
                      <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto pr-1">
                        {groupBuy.reservations.length === 0 ? (
                          <p className="rounded-2xl bg-white/[0.06] p-4 text-sm text-white/50">
                            No reservations yet.
                          </p>
                        ) : (
                          groupBuy.reservations.map((reservation) => (
                            <div
                              key={reservation.id}
                              className="rounded-2xl bg-white/[0.06] p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-bold">{reservation.buyerName}</p>
                                  <p className="text-xs text-white/45">
                                    {reservation.phone} · {reservation.buyerType}
                                  </p>
                                </div>
                                <StatusBadge status={reservation.paymentStatus} />
                              </div>
                              <p className="mt-2 text-sm text-white/60">
                                {reservation.quantity} {groupBuy.unit} · {formatNaira(reservation.amount)}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </AdminPageShell>
  );
}
