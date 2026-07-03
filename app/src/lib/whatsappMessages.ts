import { formatNaira } from "@/lib/format";

type OrderMessageInput = {
  code: string;
  buyerName: string;
  phone: string;
  paymentStatus: string;
  fulfilmentStatus: string;
  deliveryMethod: string;
  deliveryNote: string | null;
  estimatedTotal: number;
  items: {
    name: string;
    grade: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
  }[];
};

type GroupBuyMessageInput = {
  code: string;
  title: string;
  status: string;
  paymentStatus: string;
  fulfilmentStatus: string;
  minQuantity: number;
  targetQuantity: number;
  reservedQuantity: number;
  unit: string;
  pickupWindow: string | null;
  items: {
    name: string;
    grade: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
  }[];
};

type ReservationMessageInput = {
  buyerName: string;
  phone: string;
  buyerType: string;
  quantity: number;
  amount: number;
  paymentStatus: string;
};

export function cleanPhoneForWhatsapp(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

export function createWhatsappUrl(phone: string, message: string) {
  const cleanedPhone = cleanPhoneForWhatsapp(phone);
  const encodedMessage = encodeURIComponent(message);

  if (!cleanedPhone) {
    return `https://wa.me/?text=${encodedMessage}`;
  }

  return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
}

export function createOrderItemsText(items: OrderMessageInput["items"]) {
  if (items.length === 0) {
    return "Items: To be confirmed";
  }

  return items
    .map((item) => {
      return `- ${item.quantity} ${item.unit} ${item.name} (${item.grade}) @ ${formatNaira(item.unitPrice)} = ${formatNaira(item.lineTotal)}`;
    })
    .join("\n");
}

export function createOrderConfirmationMessage(order: OrderMessageInput) {
  return `Hi ${order.buyerName}, your OneFarmTech order ${order.code} has been created.

${createOrderItemsText(order.items)}

Estimated total: ${order.estimatedTotal > 0 ? formatNaira(order.estimatedTotal) : "To be confirmed"}
Payment status: ${order.paymentStatus}
Fulfilment status: ${order.fulfilmentStatus}
Delivery: ${order.deliveryMethod}
Delivery note: ${order.deliveryNote || "To be confirmed"}

We will confirm availability, payment instructions, and fulfilment next steps.`;
}

export function createPaymentReminderMessage(order: OrderMessageInput) {
  return `Hi ${order.buyerName}, this is a OneFarmTech payment reminder for order ${order.code}.

Amount due: ${order.estimatedTotal > 0 ? formatNaira(order.estimatedTotal) : "To be confirmed"}
Current payment status: ${order.paymentStatus}

Please send payment confirmation/reference once paid so we can proceed with allocation and fulfilment.`;
}

export function createDeliveryUpdateMessage(order: OrderMessageInput) {
  return `Hi ${order.buyerName}, update on your OneFarmTech order ${order.code}.

Fulfilment status: ${order.fulfilmentStatus}
Delivery method: ${order.deliveryMethod}
Delivery note: ${order.deliveryNote || "To be confirmed"}

We will keep you updated as the order moves through allocation, packing, and delivery.`;
}

export function createGroupBuyBroadcastMessage(groupBuy: GroupBuyMessageInput) {
  const item = groupBuy.items[0];
  const unitPrice = item?.unitPrice || 0;
  const progress = `${groupBuy.reservedQuantity}/${groupBuy.targetQuantity} ${groupBuy.unit}`;

  return `OneFarmTech Group Buy: ${groupBuy.title}

Code: ${groupBuy.code}
Item: ${item ? `${item.name} (${item.grade})` : "To be confirmed"}
Unit price: ${unitPrice > 0 ? formatNaira(unitPrice) : "To be confirmed"}
Progress: ${progress}
Minimum quantity: ${groupBuy.minQuantity} ${groupBuy.unit}
Status: ${groupBuy.status}
Payment: ${groupBuy.paymentStatus}
Pickup window: ${groupBuy.pickupWindow || "To be confirmed"}

Reply with your name, quantity, and delivery/pickup preference to reserve a slot.`;
}

export function createReservationFollowUpMessage(
  groupBuy: GroupBuyMessageInput,
  reservation: ReservationMessageInput
) {
  return `Hi ${reservation.buyerName}, your reservation for OneFarmTech group buy ${groupBuy.code} has been recorded.

Group buy: ${groupBuy.title}
Quantity: ${reservation.quantity} ${groupBuy.unit}
Amount: ${formatNaira(reservation.amount)}
Payment status: ${reservation.paymentStatus}
Pickup window: ${groupBuy.pickupWindow || "To be confirmed"}

Your slot is only confirmed once payment is received or admin approves payment terms.`;
}
