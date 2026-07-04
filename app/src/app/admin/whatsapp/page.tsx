import Link from "next/link";
import AdminPageShell from "@/components/AdminPageShell";
import StatusBadge from "@/components/admin/StatusBadge";
import { getDbOrders, formatOrderTotal } from "@/data/dbOrders";
import { getDbGroupBuys } from "@/data/dbAdmin";
import {
  createDeliveryUpdateMessage,
  createGroupBuyBroadcastMessage,
  createOrderConfirmationMessage,
  createPaymentReminderMessage,
  createReservationFollowUpMessage,
  createWhatsappUrl,
} from "@/lib/whatsappMessages";

export default async function WhatsappOpsPage() {
  const [orders, groupBuys] = await Promise.all([
    getDbOrders(),
    getDbGroupBuys(),
  ]);

  const activeOrders = orders.slice(0, 10);
  const activeGroupBuys = groupBuys.slice(0, 8);

  return (
    <AdminPageShell
      title="WhatsApp ops"
      description="Manual WhatsApp-first operating centre for order confirmations, payment reminders, delivery updates, and group-buy broadcasts."
    >
      <div className="grid gap-8">
        <section className="rounded-[2rem] bg-white p-6 text-[#102015] shadow-sm">
          <h2 className="text-2xl font-bold">Order WhatsApp messages</h2>
          <p className="mt-2 text-sm text-[#405348]">
            Open WhatsApp with a prepared message, then review and send manually.
          </p>

          <div className="mt-6 grid gap-4">
            {activeOrders.map((order) => {
              const confirmationMessage = createOrderConfirmationMessage(order);
              const paymentMessage = createPaymentReminderMessage(order);
              const deliveryMessage = createDeliveryUpdateMessage(order);

              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-[#e3e8dc] bg-[#f7f5ec] p-5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <Link
                        href={`/admin/orders/${order.code}`}
                        className="text-sm font-bold text-[#1f7a3f] hover:underline"
                      >
                        {order.code}
                      </Link>
                      <h3 className="mt-1 text-xl font-black">{order.buyerName}</h3>
                      <p className="mt-1 text-sm text-[#405348]">
                        {order.phone} · {formatOrderTotal(order.estimatedTotal)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={order.paymentStatus} />
                      <StatusBadge status={order.fulfilmentStatus} />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <a
                      href={createWhatsappUrl(order.phone, confirmationMessage)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-[#1f7a3f] px-4 py-3 text-center text-sm font-bold text-white"
                    >
                      Send confirmation
                    </a>
                    <a
                      href={createWhatsappUrl(order.phone, paymentMessage)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-white px-4 py-3 text-center text-sm font-bold text-[#102015]"
                    >
                      Send payment reminder
                    </a>
                    <a
                      href={createWhatsappUrl(order.phone, deliveryMessage)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[#1f7a3f]/25 px-4 py-3 text-center text-sm font-bold text-[#1f7a3f]"
                    >
                      Send delivery update
                    </a>
                  </div>

                  <details className="mt-4 rounded-2xl bg-white p-4">
                    <summary className="cursor-pointer text-sm font-bold text-[#1f7a3f]">
                      Preview order confirmation message
                    </summary>
                    <pre className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#405348]">
                      {confirmationMessage}
                    </pre>
                  </details>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#102015]/10 bg-white p-6 text-[#102015]">
          <h2 className="text-2xl font-bold">Group-buy WhatsApp broadcasts</h2>
          <p className="mt-2 text-sm text-[#587063]">
            Broadcast group-buy offers and follow up with buyers who reserved slots.
          </p>

          <div className="mt-6 grid gap-6">
            {activeGroupBuys.length === 0 ? (
              <p className="rounded-2xl bg-[#f3f8ef] p-4 text-sm text-[#587063]">
                No group buys yet.
              </p>
            ) : (
              activeGroupBuys.map((groupBuy) => {
                const broadcastMessage = createGroupBuyBroadcastMessage(groupBuy);

                return (
                  <article
                    key={groupBuy.id}
                    className="rounded-2xl bg-[#f3f8ef] p-5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#1f7a3f]">
                          {groupBuy.code}
                        </p>
                        <h3 className="mt-1 text-xl font-black">{groupBuy.title}</h3>
                        <p className="mt-1 text-sm text-[#587063]">
                          Reserved {groupBuy.reservedQuantity}/{groupBuy.targetQuantity} {groupBuy.unit}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={groupBuy.status} />
                        <StatusBadge status={groupBuy.paymentStatus} />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <a
                        href={createWhatsappUrl("", broadcastMessage)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-[#9ee6ad] px-4 py-3 text-center text-sm font-bold text-[#102015]"
                      >
                        Open broadcast message
                      </a>

                      <Link
                        href="/admin/group-buys"
                        className="rounded-full border border-[#102015]/10 px-4 py-3 text-center text-sm font-bold text-[#1f7a3f]"
                      >
                        Manage group buy
                      </Link>
                    </div>

                    <details className="mt-4 rounded-2xl bg-[#f3f8ef] p-4">
                      <summary className="cursor-pointer text-sm font-bold text-[#1f7a3f]">
                        Preview broadcast message
                      </summary>
                      <pre className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#405348]">
                        {broadcastMessage}
                      </pre>
                    </details>

                    <div className="mt-5 grid gap-3">
                      {groupBuy.reservations.length === 0 ? (
                        <p className="rounded-2xl bg-[#f3f8ef] p-4 text-sm text-[#587063]">
                          No reservations to follow up yet.
                        </p>
                      ) : (
                        groupBuy.reservations.map((reservation) => {
                          const reservationMessage = createReservationFollowUpMessage(
                            groupBuy,
                            reservation
                          );

                          return (
                            <div
                              key={reservation.id}
                              className="rounded-2xl bg-[#f3f8ef] p-4"
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="font-bold">{reservation.buyerName}</p>
                                  <p className="mt-1 text-sm text-[#587063]">
                                    {reservation.phone} · {reservation.quantity} {groupBuy.unit}
                                  </p>
                                </div>

                                <a
                                  href={createWhatsappUrl(
                                    reservation.phone,
                                    reservationMessage
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full bg-[#9ee6ad] px-4 py-2 text-center text-sm font-bold text-[#102015]"
                                >
                                  Follow up
                                </a>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
