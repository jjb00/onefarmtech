type FlutterwaveCheckoutInput = {
  reference: string;
  amount: number;
  currency?: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  redirectUrl?: string;
  metadata?: Record<string, unknown>;
};

type FlutterwaveCheckoutResult = {
  provider: "Flutterwave";
  paymentUrl: string;
  gatewayReference: string;
};

export type FlutterwaveVerificationResult = {
  ok: boolean;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  providerId: string;
  metadata: Record<string, unknown>;
};

function requireFlutterwaveSecretKey() {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("FLUTTERWAVE_SECRET_KEY is not configured.");
  }

  return secretKey;
}

export async function createFlutterwaveCheckout(
  input: FlutterwaveCheckoutInput,
): Promise<FlutterwaveCheckoutResult> {
  const secretKey = requireFlutterwaveSecretKey();

  if (!input.email) {
    throw new Error("Flutterwave checkout requires a buyer email or FLUTTERWAVE_FALLBACK_EMAIL.");
  }

  if (!input.reference) {
    throw new Error("Flutterwave checkout requires a payment reference.");
  }

  if (!input.amount || input.amount <= 0) {
    throw new Error("Flutterwave checkout requires a positive amount.");
  }

  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: input.reference,
      amount: input.amount,
      currency: input.currency || "NGN",
      redirect_url: input.redirectUrl,
      customer: {
        email: input.email,
        name: input.name || undefined,
        phonenumber: input.phone || undefined,
      },
      customizations: {
        title: "OneFarmTech",
        description: `Payment request ${input.reference}`,
      },
      meta: input.metadata || {},
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.status) {
    const message =
      payload?.message ||
      `Flutterwave checkout failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  const data = payload.data || {};

  if (!data.link) {
    throw new Error("Flutterwave did not return a payment link.");
  }

  return {
    provider: "Flutterwave",
    paymentUrl: data.link,
    gatewayReference: input.reference,
  };
}

export async function verifyFlutterwaveTransaction(transactionId: string): Promise<FlutterwaveVerificationResult> {
  if (!transactionId) throw new Error("Flutterwave transaction ID is required for verification.");
  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
    headers: {Authorization: `Bearer ${requireFlutterwaveSecretKey()}`},
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.status !== "success" || !payload?.data) {
    throw new Error(payload?.message || `Flutterwave verification failed with HTTP ${response.status}.`);
  }
  const data = payload.data;
  return {
    ok: String(data.status || "").toLowerCase() === "successful",
    status: String(data.status || "unknown"),
    reference: String(data.tx_ref || ""),
    amount: Number(data.amount),
    currency: String(data.currency || "").toUpperCase(),
    providerId: String(data.id || transactionId),
    metadata: {processorResponse: data.processor_response || null, chargedAmount: data.charged_amount ?? null},
  };
}
