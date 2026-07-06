type PaymentInstructionInput = {
  orderCode: string;
  buyerName?: string | null;
  amount: number;
  currency?: string | null;
  reference: string;
  provider?: string | null;
  paymentUrl?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
};

function formatNaira(amount: number | null | undefined) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function clean(value: string | null | undefined) {
  return String(value || "").trim();
}

export function buildPaymentInstructionMessage(input: PaymentInstructionInput) {
  const provider = clean(input.provider) || "Manual";
  const buyerName = clean(input.buyerName);
  const greeting = buyerName ? `Hi ${buyerName},` : "Hi,";
  const amount = formatNaira(input.amount);

  const lines = [
    greeting,
    "",
    `Your OneFarmTech payment request for order ${input.orderCode} is ready.`,
    "",
    `Amount: ${amount}`,
    `Payment reference: ${input.reference}`,
  ];

  if (input.paymentUrl) {
    lines.push("", `Pay here: ${input.paymentUrl}`);
  }

  if (input.bankName || input.accountNumber || input.accountName) {
    lines.push("", "Bank transfer details:");

    if (input.bankName) lines.push(`Bank: ${input.bankName}`);
    if (input.accountNumber) lines.push(`Account number: ${input.accountNumber}`);
    if (input.accountName) lines.push(`Account name: ${input.accountName}`);
  }

  if (!input.paymentUrl && !input.bankName && !input.accountNumber && !input.accountName) {
    lines.push(
      "",
      `Payment method: ${provider}`,
      "Please use the payment reference above when making payment.",
    );
  }

  lines.push(
    "",
    "Please send payment confirmation on WhatsApp after payment.",
    "Thank you.",
  );

  return lines.join("\\n");
}

export function buildPaymentReceivedMessage(input: {
  orderCode: string;
  buyerName?: string | null;
  amount: number;
  reference: string;
  provider?: string | null;
}) {
  const buyerName = clean(input.buyerName);
  const greeting = buyerName ? `Hi ${buyerName},` : "Hi,";

  return [
    greeting,
    "",
    `Payment has been received for order ${input.orderCode}.`,
    "",
    `Amount: ${formatNaira(input.amount)}`,
    `Reference: ${input.reference}`,
    `Provider: ${clean(input.provider) || "Payment"}`,
    "",
    "We will continue processing your order and update you on fulfilment.",
    "Thank you.",
  ].join("\\n");
}

export function buildReceiptIssuedMessage(input: {
  orderCode: string;
  buyerName?: string | null;
  receiptCode: string;
  amount: number;
}) {
  const buyerName = clean(input.buyerName);
  const greeting = buyerName ? `Hi ${buyerName},` : "Hi,";

  return [
    greeting,
    "",
    `Receipt ${input.receiptCode} has been issued for order ${input.orderCode}.`,
    "",
    `Amount: ${formatNaira(input.amount)}`,
    "",
    "Thank you for ordering with OneFarmTech.",
  ].join("\\n");
}
