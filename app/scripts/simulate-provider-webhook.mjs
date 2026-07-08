import crypto from "node:crypto";

const provider = process.argv[2];
const reference = process.argv[3];

const baseUrl = process.env.WEBHOOK_TEST_BASE_URL || "http://localhost:3002";

function usage() {
  console.log(`
Usage:
  node scripts/simulate-provider-webhook.mjs paystack PAYMENT_REFERENCE
  node scripts/simulate-provider-webhook.mjs flutterwave PAYMENT_REFERENCE
  node scripts/simulate-provider-webhook.mjs whatsapp +2348012345678 "I want 2 baskets of tomatoes delivered to Lekki tomorrow"

Env:
  WEBHOOK_TEST_BASE_URL=http://localhost:3002
  PAYSTACK_WEBHOOK_SECRET=...
  PAYSTACK_SECRET_KEY=...
  FLUTTERWAVE_WEBHOOK_SECRET_HASH=...
  WHATSAPP_APP_SECRET=...
`);
}

if (!provider) {
  usage();
  process.exit(1);
}

async function postJson(path, body, headers = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  console.log(`POST ${url}`);
  console.log(`Status: ${response.status}`);
  console.log(text || "(empty response)");

  if (!response.ok) {
    process.exit(1);
  }
}

if (provider === "paystack") {
  if (!reference) {
    usage();
    process.exit(1);
  }

  const body = {
    event: "charge.success",
    data: {
      id: Math.floor(Date.now() / 1000),
      reference,
      amount: 100000,
      currency: "NGN",
      status: "success",
      gateway_response: "Successful",
      paid_at: new Date().toISOString(),
      customer: {
        email: process.env.PAYMENT_FALLBACK_EMAIL || "buyer@example.com",
      },
    },
  };

  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    console.error("Missing PAYSTACK_WEBHOOK_SECRET or PAYSTACK_SECRET_KEY.");
    process.exit(1);
  }

  const signature = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(body))
    .digest("hex");

  await postJson("/api/payments/webhook", body, {
    "x-paystack-signature": signature,
  });

  process.exit(0);
}

if (provider === "flutterwave") {
  if (!reference) {
    usage();
    process.exit(1);
  }

  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;

  if (!secretHash) {
    console.error("Missing FLUTTERWAVE_WEBHOOK_SECRET_HASH.");
    process.exit(1);
  }

  const body = {
    event: "charge.completed",
    data: {
      id: Math.floor(Date.now() / 1000),
      tx_ref: reference,
      flw_ref: `FLW-${reference}`,
      amount: 1000,
      currency: "NGN",
      status: "successful",
      customer: {
        email: process.env.PAYMENT_FALLBACK_EMAIL || "buyer@example.com",
      },
    },
  };

  await postJson("/api/payments/flutterwave/webhook", body, {
    "verif-hash": secretHash,
  });

  process.exit(0);
}

if (provider === "whatsapp") {
  const from = reference;
  const bodyText = process.argv.slice(4).join(" ");

  if (!from || !bodyText) {
    usage();
    process.exit(1);
  }

  const body = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "test-entry",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "2340000000000",
                phone_number_id: "test-phone-number-id",
              },
              contacts: [
                {
                  profile: {
                    name: "Test WhatsApp Buyer",
                  },
                  wa_id: from.replace(/\D/g, ""),
                },
              ],
              messages: [
                {
                  from: from.replace(/\D/g, ""),
                  id: `wamid.test.${Date.now()}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  text: {
                    body: bodyText,
                  },
                  type: "text",
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const headers = {};

  if (appSecret) {
    headers["x-hub-signature-256"] =
      "sha256=" +
      crypto.createHmac("sha256", appSecret).update(JSON.stringify(body)).digest("hex");
  }

  await postJson("/api/whatsapp/webhook", body, headers);

  process.exit(0);
}

usage();
process.exit(1);
