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

export type PaystackVerificationResult = {
  ok: boolean;
  status: string;
  reference: string;
  amountMinor: number;
  currency: string;
  providerId?: string;
  metadata: Record<string, unknown>;
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

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerificationResult> {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {Authorization: `Bearer ${requirePaystackSecretKey()}`},
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.status || !payload?.data) {
    throw new Error(payload?.message || `Paystack verification failed with HTTP ${response.status}.`);
  }
  const data = payload.data;
  return {
    ok: data.status === "success",
    status: String(data.status || "unknown"),
    reference: String(data.reference || ""),
    amountMinor: Number(data.amount),
    currency: String(data.currency || "").toUpperCase(),
    providerId: data.id ? String(data.id) : undefined,
    metadata: {gatewayResponse: data.gateway_response || null, paidAt: data.paid_at || null},
  };
}
