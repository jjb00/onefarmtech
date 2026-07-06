import {createPaystackCheckout} from "./paystack";

export type PaymentProviderName = "Manual" | "Bank transfer" | "Paystack" | "Flutterwave" | "Cash";

export type PaymentCheckoutInput = {
  provider: PaymentProviderName | string;
  reference: string;
  amount: number;
  currency?: string;
  buyerEmail?: string | null;
  buyerName?: string | null;
  buyerPhone?: string | null;
  orderCode?: string | null;
  callbackPath?: string;
};

export type PaymentCheckoutResult = {
  provider: PaymentProviderName | string;
  paymentUrl: string;
  gatewayReference: string;
  metadata?: Record<string, unknown>;
};

function getBaseUrl() {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3002"
  ).replace(/\/$/, "");
}

function getCheckoutEmail(input: PaymentCheckoutInput) {
  return (
    input.buyerEmail ||
    process.env.PAYSTACK_FALLBACK_EMAIL ||
    ""
  ).trim();
}

export async function createPaymentCheckout(
  input: PaymentCheckoutInput,
): Promise<PaymentCheckoutResult> {
  const provider = String(input.provider || "Manual").trim();

  if (provider !== "Paystack") {
    throw new Error(`Automated checkout is not configured for ${provider}.`);
  }

  const callbackPath =
    input.callbackPath ||
    `/admin/payment-requests?reference=${encodeURIComponent(input.reference)}`;

  const checkout = await createPaystackCheckout({
    reference: input.reference,
    amount: input.amount,
    currency: input.currency || "NGN",
    email: getCheckoutEmail(input),
    callbackUrl: `${getBaseUrl()}${callbackPath}`,
    metadata: {
      orderCode: input.orderCode,
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      source: "OneFarmTech",
    },
  });

  return {
    provider: checkout.provider,
    paymentUrl: checkout.paymentUrl,
    gatewayReference: checkout.gatewayReference,
    metadata: {
      accessCode: checkout.accessCode,
    },
  };
}
