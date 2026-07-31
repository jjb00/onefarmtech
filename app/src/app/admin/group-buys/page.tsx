import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import StatusBadge from "@/components/admin/StatusBadge";
import {getDbGroupBuys, getDbProducts} from "@/data/dbAdmin";
import {
  createGroupBuyAction,
  createGroupBuyReservationAction,
  updateGroupBuyAction,
  updateGroupBuyReservationAction,
} from "@/actions/groupBuys";
import {buyerTypes} from "@/constants/orderOptions";
import {isPaidGroupBuyReservationStatus} from "@/lib/groupBuyState.js";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | null) {
  if (!date) return "No close date";

  return new Intl.DateTimeFormat("en-GB", {timeZone: "Africa/Lagos", 
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const groupBuyStatuses = [
  "Draft",
  "Open",
  "Paused",
  "Closed",
  "Minimum met",
  "Fully reserved",
  "Processing",
  "Completed",
  "Cancelled",
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

const reservationPaymentStatuses = [
  "Unpaid",
  "Deposit pending",
  "Deposit paid",
  "Fully paid",
  "Paid",
  "Approved",
  "Refund pending",
  "Refunded",
];

export default async function GroupBuysPage() {
  const [groupBuys, products] = await Promise.all([
    getDbGroupBuys(),
    getDbProducts(),
  ]);

  const openCount = groupBuys.filter((groupBuy) =>
    ["Open", "Minimum met", "Fully reserved"].includes(groupBuy.status),
  ).length;
  const processingCount = groupBuys.filter(
    (groupBuy) =>
      groupBuy.status === "Processing" ||
      ["Allocation", "Awaiting harvest", "Packed", "Ready for pickup"].includes(
        groupBuy.fulfilmentStatus,
      ),
  ).length;
  const completedCount = groupBuys.filter(
    (groupBuy) =>
      groupBuy.status === "Completed" || groupBuy.fulfilmentStatus === "Completed",
  ).length;

  return (
    <AdminPageShell
      title="Group buys"
      description="Create and manage group-buy windows."
    >
      <div className="grid gap-5">
        <nav
          aria-label="Product workspace"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          <Link
            href="/admin/products"
            className="whitespace-nowrap rounded-full border bg-white px-4 py-2.5 text-sm font-black text-[#102015]"
          >
            Products
          </Link>
          <Link
            href="/admin/group-buys"
            aria-current="page"
            className="whitespace-nowrap rounded-full bg-[#102015] px-4 py-2.5 text-sm font-black text-white"
          >
            Group buys
          </Link>
          <Link
            href="/admin/pickup-locations"
            className="whitespace-nowrap rounded-full border bg-white px-4 py-2.5 text-sm font-black text-[#102015]"
          >
            Delivery & pickup
          </Link>
        </nav>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Open windows" value={String(openCount)} />
          <Metric label="Processing" value={String(processingCount)} />
          <Metric label="Completed" value={String(completedCount)} />
        </section>

        <details className="rounded-2xl border border-[#102015]/10 bg-white p-4 text-[#102015]">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Create group buy</h2>
                <p className="mt-1 text-sm text-[#405348]">
                  New campaigns stay closed until staff opens them.
                </p>
              </div>
              <span className="text-sm font-black text-[#1f7a3f]">Open form</span>
            </div>
          </summary>

          <form action={createGroupBuyAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Group-buy title">
              <input
                name="title"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal"
                placeholder="e.g. Weekend bulk-buy window"
              />
            </Field>

            <Field label="Existing product">
              <select
                name="productId"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal"
                defaultValue=""
              >
                <option value="">Manual item / no product link</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.grade} · {product.unit} ·{" "}
                    {formatNaira(product.basePrice)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Product name">
              <input
                name="productName"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal"
              />
            </Field>

            <Field label="Grade">
              <input
                name="grade"
                defaultValue="Standard"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal"
              />
            </Field>

            <Field label="Unit">
              <input
                name="unit"
                defaultValue="basket"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal"
              />
            </Field>

            <Field label="Unit price">
              <input
                name="unitPrice"
                type="number"
                min="1"
                required
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal"
              />
            </Field>

            <Field label="Minimum paid quantity">
              <input
                name="minQuantity"
                type="number"
                min="0"
                defaultValue="0"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal"
              />
            </Field>

            <Field label="Target quantity">
              <input
                name="targetQuantity"
                type="number"
                min="1"
                required
                defaultValue="20"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal"
              />
            </Field>

            <Field label="Closing date">
              <span className="flex w-full min-w-0 rounded-xl border border-gray-200 px-4 py-3">
                <input
                  name="closingDate"
                  type="date"
                  className="block w-full min-w-0 border-0 bg-transparent p-0 font-normal"
                />
              </span>
            </Field>

            <Field label="Pickup or delivery window">
              <input
                name="pickupWindow"
                placeholder="e.g. Saturday 10am–2pm"
                className="rounded-xl border border-gray-200 px-4 py-3 font-normal"
              />
            </Field>

            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Description
              <textarea
                name="description"
                className="min-h-24 rounded-xl border border-gray-200 px-4 py-3 font-normal"
                placeholder="Buyer-facing offer and fulfilment expectations."
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Internal note
              <textarea
                name="adminNote"
                className="min-h-20 rounded-xl border border-gray-200 px-4 py-3 font-normal"
                placeholder="Supplier, route, pricing or quality notes."
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-[#1f7a3f] px-5 py-3 text-sm font-black text-white"
              >
                Create closed group buy
              </button>
            </div>
          </form>
        </details>

        <section className="grid gap-4">
          {groupBuys.length ? (
            groupBuys.map((groupBuy) => {
              const firstItem = groupBuy.items[0];
              const unitPrice = firstItem?.unitPrice || 0;
              const progress =
                groupBuy.targetQuantity > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (groupBuy.reservedQuantity / groupBuy.targetQuantity) * 100,
                      ),
                    )
                  : 0;
              const paidReservations = groupBuy.reservations.filter((reservation) =>
                isPaidGroupBuyReservationStatus(reservation.paymentStatus),
              );
              const paidValue = paidReservations.reduce(
                (sum, reservation) => sum + reservation.amount,
                0,
              );

              return (
                <article
                  key={groupBuy.id}
                  className="overflow-hidden rounded-2xl border border-[#102015]/10 bg-white text-[#102015]"
                >
                  <div className="p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1f7a3f]">
                          {groupBuy.code}
                        </p>
                        <h2 className="mt-1 text-xl font-black">{groupBuy.title}</h2>
                        <p className="mt-1 text-sm text-[#405348]">
                          {firstItem?.name || "No item"} ·{" "}
                          {groupBuy.pickupWindow || "Fulfilment window not set"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={groupBuy.status} />
                        <StatusBadge status={groupBuy.paymentStatus} />
                        <StatusBadge status={groupBuy.fulfilmentStatus} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <SmallMetric
                        label="Paid quantity"
                        value={`${groupBuy.reservedQuantity} / ${groupBuy.targetQuantity} ${groupBuy.unit}`}
                      />
                      <SmallMetric
                        label="Paid reservations"
                        value={String(paidReservations.length)}
                      />
                      <SmallMetric label="Paid value" value={formatNaira(paidValue)} />
                      <SmallMetric
                        label="Closes"
                        value={formatDate(groupBuy.closingDate)}
                      />
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-bold text-[#587063]">
                        <span>Confirmed paid progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#eef1e4]">
                        <div
                          className="h-full rounded-full bg-[#1f7a3f]"
                          style={{width: `${progress}%`}}
                        />
                      </div>
                    </div>
                  </div>

                  <details className="border-t border-[#102015]/10">
                    <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-[#1f7a3f]">
                      Manage group buy
                    </summary>

                    <div className="grid gap-5 border-t border-[#102015]/10 p-4 xl:grid-cols-[0.8fr_1fr_1.2fr]">
                      <form action={updateGroupBuyAction} className="grid content-start gap-3">
                        <h3 className="font-black">Campaign controls</h3>
                        <select
                          name="status"
                          defaultValue={groupBuy.status}
                          className="rounded-xl border border-gray-200 px-4 py-3"
                        >
                          {groupBuyStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>

                        <select
                          name="fulfilmentStatus"
                          defaultValue={groupBuy.fulfilmentStatus}
                          className="rounded-xl border border-gray-200 px-4 py-3"
                        >
                          {groupBuyFulfilmentStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>

                        <textarea
                          name="adminNote"
                          defaultValue={groupBuy.adminNote || ""}
                          className="min-h-24 rounded-xl border border-gray-200 px-4 py-3"
                          placeholder="Internal note"
                        />

                        <input type="hidden" name="groupBuyId" value={groupBuy.id} />

                        <button
                          type="submit"
                          className="rounded-full bg-[#102015] px-4 py-2.5 text-sm font-black text-white"
                        >
                          Save controls
                        </button>

                        <p className="text-xs leading-5 text-[#587063]">
                          Confirmed payments update the group-buy progress.
                        </p>
                      </form>

                      <form
                        action={createGroupBuyReservationAction}
                        className="grid content-start gap-3"
                      >
                        <h3 className="font-black">Add reservation</h3>
                        <input type="hidden" name="groupBuyId" value={groupBuy.id} />
                        <input type="hidden" name="unitPrice" value={unitPrice} />

                        <input
                          name="buyerName"
                          required
                          placeholder="Buyer name"
                          className="rounded-xl border border-gray-200 px-4 py-3"
                        />
                        <input
                          name="phone"
                          required
                          placeholder="+234..."
                          className="rounded-xl border border-gray-200 px-4 py-3"
                        />
                        <select
                          name="buyerType"
                          defaultValue="Individual"
                          className="rounded-xl border border-gray-200 px-4 py-3"
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
                          className="rounded-xl border border-gray-200 px-4 py-3"
                        />
                        <select
                          name="paymentStatus"
                          defaultValue="Unpaid"
                          className="rounded-xl border border-gray-200 px-4 py-3"
                        >
                          {reservationPaymentStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>

                        <button
                          type="submit"
                          className="rounded-full bg-[#1f7a3f] px-4 py-2.5 text-sm font-black text-white"
                        >
                          Save reservation
                        </button>
                      </form>

                      <div>
                        <h3 className="font-black">Reservations</h3>
                        <div className="mt-3 grid gap-2">
                          {groupBuy.reservations.length ? (
                            groupBuy.reservations.map((reservation) => (
                              <form
                                key={reservation.id}
                                action={updateGroupBuyReservationAction}
                                className="grid gap-3 border-t border-[#102015]/10 py-3 first:border-t-0 first:pt-0 sm:grid-cols-[1fr_auto] sm:items-center"
                              >
                                <div>
                                  <p className="font-bold">{reservation.buyerName}</p>
                                  <p className="mt-1 text-xs text-[#587063]">
                                    {reservation.phone} · {reservation.quantity}{" "}
                                    {groupBuy.unit} · {formatNaira(reservation.amount)}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <input
                                    type="hidden"
                                    name="reservationId"
                                    value={reservation.id}
                                  />
                                  <select
                                    name="paymentStatus"
                                    defaultValue={reservation.paymentStatus}
                                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                  >
                                    {reservationPaymentStatuses.map((status) => (
                                      <option key={status}>{status}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="submit"
                                    className="rounded-full border border-[#1f7a3f]/20 px-3 py-2 text-xs font-black text-[#1f7a3f]"
                                  >
                                    Update
                                  </button>
                                </div>
                              </form>
                            ))
                          ) : (
                            <p className="text-sm text-[#587063]">
                              No reservations yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-[#102015]/10 bg-white p-5">
              <h2 className="font-black">No group buys yet</h2>
              <p className="mt-1 text-sm text-[#405348]">
                Create the first closed campaign above, then open it when ready.
              </p>
            </div>
          )}
        </section>
      </div>
    </AdminPageShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-2xl border border-[#102015]/10 bg-white p-4">
      <p className="text-2xl font-black text-[#102015]">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[#587063]">
        {label}
      </p>
    </div>
  );
}

function SmallMetric({label, value}: {label: string; value: string}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#587063]">
        {label}
      </p>
      <p className="mt-1 font-black text-[#102015]">{value}</p>
    </div>
  );
}
