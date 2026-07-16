import {createPaystackCheckout} from "./paystack";
import {createFlutterwaveCheckout} from "./flutterwave";

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
  httpStatus: number;
  metadata?: Record<string, unknown>;
};

export function getPaymentBaseUrl() {
  const configured = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("APP_BASE_URL is required for production payment links.");
  }
  const baseUrl = (configured || "http://localhost:3002").trim().replace(/\/$/, "");
  if (process.env.NODE_ENV === "production" && baseUrl !== "https://onefarmtech.com") {
    throw new Error("APP_BASE_URL must be https://onefarmtech.com for production payment links.");
  }
  return baseUrl;
}

export function getPaymentCallbackUrls() {
  const baseUrl = getPaymentBaseUrl();
  return {
    paystack: `${baseUrl}/api/payments/webhook`,
    flutterwave: `${baseUrl}/api/payments/flutterwave/webhook`,
    returnUrl: `${baseUrl}/admin/payment-requests`,
  };
}

function getCheckoutEmail(input: PaymentCheckoutInput) {
  const provider = String(input.provider || "").trim();

  return (
    input.buyerEmail ||
    (provider === "Flutterwave"
      ? process.env.FLUTTERWAVE_FALLBACK_EMAIL
      : process.env.PAYSTACK_FALLBACK_EMAIL) ||
    process.env.PAYMENT_FALLBACK_EMAIL ||
    ""
  ).trim();
}

export async function createPaymentCheckout(
  input: PaymentCheckoutInput,
): Promise<PaymentCheckoutResult> {
  const provider = String(input.provider || "Manual").trim();

  const callbackPath =
    input.callbackPath ||
    `/admin/payment-requests?reference=${encodeURIComponent(input.reference)}`;

  if (provider === "Paystack") {
    const checkout = await createPaystackCheckout({
      reference: input.reference,
      amount: input.amount,
      currency: input.currency || "NGN",
      email: getCheckoutEmail(input),
      callbackUrl: `${getPaymentBaseUrl()}${callbackPath}`,
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
      httpStatus: checkout.httpStatus,
      metadata: {
        accessCode: checkout.accessCode,
      },
    };
  }

  if (provider === "Flutterwave") {
    const checkout = await createFlutterwaveCheckout({
      reference: input.reference,
      amount: input.amount,
      currency: input.currency || "NGN",
      email: getCheckoutEmail(input),
      name: input.buyerName,
      phone: input.buyerPhone,
      redirectUrl: `${getPaymentBaseUrl()}${callbackPath}`,
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
      httpStatus: checkout.httpStatus,
    };
  }

  throw new Error(`Automated checkout is not configured for ${provider}.`);
}
