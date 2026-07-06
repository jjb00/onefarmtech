type OrderTemplateInput = {
  code: string;
  buyerName: string;
  paymentStatus: string;
  fulfilmentStatus: string;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discountAmount: number;
  paymentReference?: string | null;
  paymentUrl?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  deliveryMethod?: string | null;
  deliveryArea?: string | null;
  deliveryAddress?: string | null;
  deliveryPartnerName?: string | null;
  trackingReference?: string | null;
  receiptCode?: string | null;
  items: Array<{
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export function formatNairaForMessage(amount: number | null | undefined) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function itemLines(items: OrderTemplateInput["items"]) {
  if (items.length === 0) return "No item lines recorded yet.";

  return items
    .map(
      (item) =>
        `- ${item.productName}: ${item.quantity} ${item.unit} x ${formatNairaForMessage(
          item.unitPrice
        )} = ${formatNairaForMessage(item.lineTotal)}`
    )
    .join("\\n");
}

export function buildOrderSummaryMessage(order: OrderTemplateInput) {
  return [
    `Hello ${order.buyerName},`,
    "",
    `Your OneFarmTech order ${order.code} has been recorded.`,
    "",
    "Order items:",
    itemLines(order.items),
    "",
    `Subtotal: ${formatNairaForMessage(order.subtotal)}`,
    `Delivery: ${formatNairaForMessage(order.deliveryFee)}`,
    `Service fee: ${formatNairaForMessage(order.serviceFee)}`,
    `Discount: ${formatNairaForMessage(order.discountAmount)}`,
    `Total: ${formatNairaForMessage(order.totalAmount)}`,
    "",
    `Payment status: ${order.paymentStatus}`,
    `Fulfilment status: ${order.fulfilmentStatus}`,
  ].join("\\n");
}

export function buildPaymentRequestMessage(order: OrderTemplateInput) {
  const lines = [
    `Hello ${order.buyerName},`,
    "",
    `Payment request for OneFarmTech order ${order.code}:`,
    "",
    `Amount: ${formatNairaForMessage(order.totalAmount)}`,
    `Reference: ${order.paymentReference || "To be confirmed"}`,
  ];

  if (order.paymentUrl) {
    lines.push(`Payment link: ${order.paymentUrl}`);
  }

  if (order.bankName || order.accountNumber || order.accountName) {
    lines.push(
      "",
      "Bank transfer details:",
      `Bank: ${order.bankName || "To be confirmed"}`,
      `Account number: ${order.accountNumber || "To be confirmed"}`,
      `Account name: ${order.accountName || "To be confirmed"}`
    );
  }

  lines.push("", "Please use the payment reference so the payment can be matched to your order.");

  return lines.join("\\n");
}

export function buildDeliveryAssignedMessage(order: OrderTemplateInput) {
  return [
    `Hello ${order.buyerName},`,
    "",
    `Delivery has been assigned for OneFarmTech order ${order.code}.`,
    "",
    `Delivery method: ${order.deliveryMethod || "Delivery"}`,
    `Delivery area: ${order.deliveryArea || "To be confirmed"}`,
    `Delivery partner: ${order.deliveryPartnerName || "OneFarmTech logistics"}`,
    `Tracking/reference: ${order.trackingReference || "To be confirmed"}`,
    "",
    `Current status: ${order.fulfilmentStatus}`,
  ].join("\\n");
}

export function buildOutForDeliveryMessage(order: OrderTemplateInput) {
  return [
    `Hello ${order.buyerName},`,
    "",
    `Your OneFarmTech order ${order.code} is out for delivery.`,
    "",
    `Delivery area: ${order.deliveryArea || "To be confirmed"}`,
    `Delivery address: ${order.deliveryAddress || "To be confirmed"}`,
    `Tracking/reference: ${order.trackingReference || "To be confirmed"}`,
    "",
    "Please keep your phone available for the delivery contact.",
  ].join("\\n");
}

export function buildDeliveredMessage(order: OrderTemplateInput) {
  return [
    `Hello ${order.buyerName},`,
    "",
    `Your OneFarmTech order ${order.code} has been marked as delivered.`,
    order.receiptCode ? `Receipt: ${order.receiptCode}` : "Receipt: to be issued or already available in your account.",
    "",
    "Thank you for ordering with OneFarmTech.",
  ].join("\\n");
}
