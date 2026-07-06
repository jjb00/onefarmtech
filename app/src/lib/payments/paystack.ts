type PaystackCheckoutInput = {
  reference: string;
  amount: number;
  currency?: string;
  email: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

type PaystackCheckoutResult = {
  provider: "Paystack";
  paymentUrl: string;
  gatewayReference: string;
  accessCode?: string;
};

function requirePaystackSecretKey() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  return secretKey;
}

export async function createPaystackCheckout(
  input: PaystackCheckoutInput,
): Promise<PaystackCheckoutResult> {
  const secretKey = requirePaystackSecretKey();

  if (!input.email) {
    throw new Error("Paystack checkout requires a buyer email or PAYSTACK_FALLBACK_EMAIL.");
  }

  if (!input.reference) {
    throw new Error("Paystack checkout requires a payment reference.");
  }

  if (!input.amount || input.amount <= 0) {
    throw new Error("Paystack checkout requires a positive amount.");
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100),
      currency: input.currency || "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata || {},
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.status) {
    const message =
      payload?.message ||
      `Paystack checkout failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  const data = payload.data || {};

  if (!data.authorization_url || !data.reference) {
    throw new Error("Paystack did not return a payment URL/reference.");
  }

  return {
    provider: "Paystack",
    paymentUrl: data.authorization_url,
    gatewayReference: data.reference,
    accessCode: data.access_code,
  };
}
