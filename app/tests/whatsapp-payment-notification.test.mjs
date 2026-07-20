import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {normaliseWhatsAppPhone, sendWhatsAppTextMessage, WhatsAppProviderError} from "../src/lib/whatsapp/provider.ts";
import {buildPaymentInstructionMessage} from "../src/lib/communications/paymentTemplates.ts";

test("payment message preserves the checkout URL and uses real line breaks", () => {
  const url = "https://checkout.paystack.com/unchanged";
  const message = buildPaymentInstructionMessage({orderCode: "OFT-1", buyerName: "Buyer", amount: 75000, currency: "NGN", reference: "PAY-1", provider: "Paystack", paymentUrl: url});
  assert.match(message, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(message, /\nPay here:/);
  assert.doesNotMatch(message, /\\n/);
});

test("Nigerian WhatsApp numbers normalize without retaining the local leading zero", () => {
  assert.equal(normaliseWhatsAppPhone("0811 121 8286"), "2348111218286");
  assert.equal(normaliseWhatsAppPhone("+234 811 121 8286"), "2348111218286");
  assert.equal(normaliseWhatsAppPhone("2348111218286"), "2348111218286");
});

test("international WhatsApp numbers retain their explicit country code", () => {
  assert.equal(normaliseWhatsAppPhone("+44 7700 900123"), "447700900123");
  assert.equal(normaliseWhatsAppPhone("0044 7700 900123"), "447700900123");
});

test("missing and ambiguous phones are rejected", () => {
  assert.throws(() => normaliseWhatsAppPhone(""), /recipient phone is required/i);
  assert.throws(() => normaliseWhatsAppPhone("447700900123"), /include a country code/i);
});

test("Meta accepted response reports acceptance separately from delivery", async () => {
  const previousFetch = globalThis.fetch;
  const previousToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const previousId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
  process.env.WHATSAPP_CLOUD_ACCESS_TOKEN = "test-token";
  process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID = "phone-id";
  globalThis.fetch = async () => new Response(JSON.stringify({messages: [{id: "wamid.accepted"}]}), {status: 200, headers: {"content-type": "application/json"}});
  try {
    const result = await sendWhatsAppTextMessage({to: "08111218286", body: "Payment link https://checkout.example/unchanged"});
    assert.equal(result.status, "Sent");
    assert.equal(result.messageId, "wamid.accepted");
    assert.equal(result.normalizedTo, "2348111218286");
    assert.equal(result.httpStatus, 200);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousToken === undefined) delete process.env.WHATSAPP_CLOUD_ACCESS_TOKEN; else process.env.WHATSAPP_CLOUD_ACCESS_TOKEN = previousToken;
    if (previousId === undefined) delete process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID; else process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID = previousId;
  }
});

test("Meta template-required error remains structured and actionable", async () => {
  const previousFetch = globalThis.fetch;
  const previousToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const previousId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
  process.env.WHATSAPP_CLOUD_ACCESS_TOKEN = "test-token";
  process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID = "phone-id";
  globalThis.fetch = async () => new Response(JSON.stringify({error: {code: 131047, message: "Re-engagement message", error_data: {details: "More than 24 hours have passed"}}}), {status: 400, headers: {"content-type": "application/json"}});
  try {
    await assert.rejects(
      () => sendWhatsAppTextMessage({to: "+2348111218286", body: "Payment"}),
      (error) => error instanceof WhatsAppProviderError && error.details.templateRequired === true && error.details.code === 131047 && /approved WhatsApp payment-notification template/i.test(error.message),
    );
  } finally {
    globalThis.fetch = previousFetch;
    if (previousToken === undefined) delete process.env.WHATSAPP_CLOUD_ACCESS_TOKEN; else process.env.WHATSAPP_CLOUD_ACCESS_TOKEN = previousToken;
    if (previousId === undefined) delete process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID; else process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID = previousId;
  }
});

test("payment WhatsApp retry reuses the request and checkout URL while persisting outcomes", () => {
  const actions = fs.readFileSync(new URL("../src/actions/createAdminRecords.ts", import.meta.url), "utf8");
  const start = actions.indexOf("export async function sendPaymentRequestWhatsAppAction");
  const end = actions.indexOf("export async function", start + 30);
  const branch = actions.slice(start, end);
  assert.doesNotMatch(branch, /paymentRequest\.create/);
  assert.match(branch, /paymentUrl: paymentRequest\.paymentUrl/);
  assert.match(branch, /status: "Pending"/);
  assert.match(branch, /status: "Sent"/);
  assert.match(branch, /status: "Failed"/);
  assert.match(branch, /whatsapp=accepted/);
});

test("admin UI distinguishes Meta acceptance from delivery and allows failed retry", () => {
  const page = fs.readFileSync(new URL("../src/app/admin/payment-requests/page.tsx", import.meta.url), "utf8");
  assert.match(page, /accepted the notification for sending; delivery status will update from Meta/);
  assert.match(page, /whatsappMessage\.status === "Failed"/);
  assert.match(page, /Retry same link/);
  assert.doesNotMatch(page, /whatsapp=sent/);
});

test("delivery webhook persists Meta failure code and message", () => {
  const webhook = fs.readFileSync(new URL("../src/app/api/whatsapp/webhook/route.ts", import.meta.url), "utf8");
  assert.match(webhook, /providerErrors/);
  assert.match(webhook, /providerError\.code/);
  assert.match(webhook, /providerError\.message/);
  assert.match(webhook, /providerError\.error_data\?\.details/);
});
