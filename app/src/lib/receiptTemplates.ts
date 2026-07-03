import { formatNaira } from "@/lib/format";

type ReceiptOrderInput = {
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

export function createPlainTextReceipt(order: ReceiptOrderInput) {
  const items =
    order.items.length === 0
      ? "Items: To be confirmed"
      : order.items
          .map(
            (item) =>
              `- ${item.quantity} ${item.unit} ${item.name} (${item.grade}) @ ${formatNaira(
                item.unitPrice
              )} = ${formatNaira(item.lineTotal)}`
          )
          .join("\n");

  return `OneFarmTech Receipt / Order Summary

Order: ${order.code}
Buyer: ${order.buyerName}
Phone: ${order.phone}

${items}

Total: ${
    order.estimatedTotal > 0 ? formatNaira(order.estimatedTotal) : "To be confirmed"
  }
Payment status: ${order.paymentStatus}
Fulfilment status: ${order.fulfilmentStatus}
Delivery: ${order.deliveryMethod}
Delivery note: ${order.deliveryNote || "To be confirmed"}

OneFarmTech
Managed food procurement for buyers, kitchens, and food businesses.`;
}
