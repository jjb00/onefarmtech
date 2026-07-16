import {getPaymentBaseUrl} from "./provider";

export type PaymentKeyMode = "test" | "live" | "unknown" | "missing";

export function paymentKeyMode(provider: "Paystack" | "Flutterwave", value?: string | null): PaymentKeyMode {
  const key = String(value || "").trim();
  if (!key) return "missing";
  if (provider === "Paystack") {
    if (key.startsWith("sk_test_")) return "test";
    if (key.startsWith("sk_live_")) return "live";
    return "unknown";
  }
  if (/test/i.test(key)) return "test";
  if (key.startsWith("FLWSECK-") || key.startsWith("FLWSECK_")) return "live";
  return "unknown";
}

export function paymentConfigurationSummary() {
  const baseUrl = getPaymentBaseUrl();
  const paystackKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY?.trim();
  return {
    paystack: {configured: Boolean(paystackKey), mode: paymentKeyMode("Paystack", paystackKey)},
    flutterwave: {configured: Boolean(flutterwaveKey), mode: paymentKeyMode("Flutterwave", flutterwaveKey)},
    appBaseUrl: baseUrl,
    paystackCallbackUrl: `${baseUrl}/admin/payment-requests?reference=<payment-reference>`,
    flutterwaveRedirectUrl: `${baseUrl}/admin/payment-requests?reference=<payment-reference>`,
  };
}
