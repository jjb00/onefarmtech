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

function isPickupDeliveryMethod(deliveryMethod: string) {
  return String(deliveryMethod || "").trim().toLowerCase().includes("pickup");
}

/**
 * Sends a WhatsApp payment confirmation straight to the order's phone
 * number -- not gated on the order having a linked Customer account, since
 * a first-time WhatsApp buyer (the common case for new growth) often
 * doesn't have one yet. This is the buyer's primary channel; the portal
 * message + email in the webhook handlers are supplementary for buyers who
 * do have an account.
 */
export async function sendPaymentConfirmationWhatsApp(order: {
  code: string;
  phone: string;
  deliveryMethod: string;
  fulfilmentStatus: string;
}, amount: number) {
  const pickup = isPickupDeliveryMethod(order.deliveryMethod);
  const nextStep = pickup
    ? "The team will confirm your pickup location and timing shortly."
    : "The team will confirm delivery timing and any delivery fee shortly.";

  const body = [
    `Payment received for order ${order.code} ✅`,
    `Amount: ${formatWhatsAppNaira(amount)}`,
    "",
    `Fulfilment: ${order.fulfilmentStatus}`,
    nextStep,
    "",
    'Reply "menu" any time for order status or support.',
  ].join("\n");

  await sendWhatsAppTextMessage({to: order.phone, body});
}

/**
 * Op alert to whoever is watching ADMIN_ALERT_WHATSAPP_NUMBER (unconfigured
 * by default -- silently skipped until set). Sent as plain text, same as the
 * buyer confirmation above, which means Meta only delivers it if that number
 * has messaged the business WhatsApp number within the last 24 hours; there
 * is no approved template backing this yet. Callers should treat a failure
 * here as non-fatal -- it must never block settling the payment itself.
 */
export async function notifyAdminOfPaymentConfirmation(order: {
  code: string;
  buyerName: string;
  phone: string;
}, amount: number) {
  const adminNumber = process.env.ADMIN_ALERT_WHATSAPP_NUMBER?.trim();
  if (!adminNumber) return;

  const body = [
    `Payment confirmed ✅`,
    `Order ${order.code} -- ${order.buyerName}`,
    `Amount: ${formatWhatsAppNaira(amount)}`,
    `Buyer: ${order.phone}`,
  ].join("\n");

  await sendWhatsAppTextMessage({to: adminNumber, body});
}
