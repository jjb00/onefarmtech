import {prisma} from "@/lib/prisma";
import {sendWhatsAppTextMessage} from "@/lib/whatsapp/provider";
import {formatWhatsAppNaira} from "@/lib/whatsapp/productCatalogue";

async function findLatestOrderForCustomer(customerId: string) {
  return prisma.order.findFirst({
    where: {customerId},
    orderBy: {createdAt: "desc"},
    select: {
      code: true,
      paymentStatus: true,
      fulfilmentStatus: true,
      totalAmount: true,
      estimatedTotal: true,
      deliveryMethod: true,
      delivery: {
        select: {
          status: true,
          trackingReference: true,
          preferredDate: true,
        },
      },
      paymentRequests: {
        orderBy: {createdAt: "desc"},
        take: 1,
        select: {status: true, paymentUrl: true},
      },
    },
  });
}

function statusMessageForOrder(order: NonNullable<Awaited<ReturnType<typeof findLatestOrderForCustomer>>>) {
  const amount = formatWhatsAppNaira(order.totalAmount || order.estimatedTotal);
  const lines = [
    `Order ${order.code}`,
    `Amount: ${amount}`,
    `Payment: ${order.paymentStatus}`,
    `Fulfilment: ${order.fulfilmentStatus}`,
  ];

  if (order.delivery) {
    lines.push(`Delivery: ${order.delivery.status}`);
    if (order.delivery.trackingReference) {
      lines.push(`Tracking: ${order.delivery.trackingReference}`);
    }
  }

  const pendingPayment = order.paymentRequests[0];
  if (pendingPayment && pendingPayment.status !== "Paid" && pendingPayment.paymentUrl) {
    lines.push("", `Pay here: ${pendingPayment.paymentUrl}`);
  }

  lines.push("", "Reply \"help\" any time to talk to the team.");

  return lines.join("\n");
}

/**
 * Sends a real-time, database-backed order status reply for a matched
 * customer. Returns false (does not send anything) if there is no order to
 * report on, so the caller can fall back to routing this to staff instead.
 */
export async function replyWithOrderStatus(input: {to: string; customerId: string | null}) {
  if (!input.customerId) return {sent: false, reason: "no-matched-customer" as const};

  const order = await findLatestOrderForCustomer(input.customerId);
  if (!order) return {sent: false, reason: "no-recent-order" as const};

  await sendWhatsAppTextMessage({to: input.to, body: statusMessageForOrder(order)});
  return {sent: true, reason: "status-sent" as const, orderCode: order.code};
}
