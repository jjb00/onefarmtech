import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {validateFlutterwaveVerification, validatePaystackVerification} from "../src/lib/payments/verificationRules.js";
import crypto from "node:crypto";
import {mapResendEventStatus, verifyResendWebhookSignature} from "../src/lib/email/resendWebhook.js";

const paystack = {ok: true, status: "success", reference: "PAY-1", amountMinor: 250000, currency: "NGN"};
const flutterwave = {ok: true, status: "successful", reference: "PAY-2", amount: 2500, currency: "NGN"};

test("valid Paystack verification passes", () => assert.equal(validatePaystackVerification({verification: paystack, reference: "PAY-1", amount: 2500, currency: "NGN"}), null));
test("Paystack provider failure is rejected", () => assert.equal(validatePaystackVerification({verification: {...paystack, ok: false}, reference: "PAY-1", amount: 2500, currency: "NGN"}), "provider-status-not-successful"));
test("Paystack wrong amount is rejected using minor units", () => assert.equal(validatePaystackVerification({verification: paystack, reference: "PAY-1", amount: 2400, currency: "NGN"}), "amount-mismatch"));
test("valid Flutterwave verification passes", () => assert.equal(validateFlutterwaveVerification({verification: flutterwave, reference: "PAY-2", amount: 2500, currency: "NGN"}), null));
test("Flutterwave provider failure is rejected", () => assert.equal(validateFlutterwaveVerification({verification: {...flutterwave, ok: false}, reference: "PAY-2", amount: 2500, currency: "NGN"}), "provider-status-not-successful"));
test("Flutterwave wrong currency is rejected", () => assert.equal(validateFlutterwaveVerification({verification: flutterwave, reference: "PAY-2", amount: 2500, currency: "USD"}), "currency-mismatch"));

test("email service has provider rejection, timeout, production config and duplicate guards", () => {
  const source = fs.readFileSync(new URL("../src/lib/email/service.ts", import.meta.url), "utf8");
  assert.match(source, /Idempotency-Key/);
  assert.match(source, /AbortSignal\.timeout/);
  assert.match(source, /NODE_ENV === "production"/);
  assert.match(source, /existing\?\.status === "Accepted"/);
  assert.match(source, /status: "Failed"/);
  assert.match(source, /Development delivery disabled/);
});

test("production links have no silent localhost fallback", () => {
  const source = fs.readFileSync(new URL("../src/lib/email/service.ts", import.meta.url), "utf8");
  const productionBranch = source.slice(source.indexOf('if (process.env.NODE_ENV === "production")'), source.indexOf('return "http://localhost:3002"'));
  assert.doesNotMatch(productionBranch, /localhost/);
  assert.match(productionBranch, /APP_BASE_URL is required/);
});

test("webhooks preserve duplicate guards and retry provider timeouts", () => {
  for (const path of ["../src/app/api/payments/webhook/route.ts", "../src/app/api/payments/flutterwave/webhook/route.ts"]) {
    const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /existingPayment/);
    assert.match(source, /status: 503/);
    assert.match(source, /payment request not found/);
    assert.match(source, /createPaymentReconciliationIncident/);
  }
});

test("valid Resend Svix signature is accepted and invalid signature is rejected", () => {
  const key = crypto.randomBytes(32);
  const secret = `whsec_${key.toString("base64")}`;
  const rawBody = JSON.stringify({type: "email.delivered", data: {email_id: "email-1"}});
  const id = "msg_test";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64");
  assert.equal(verifyResendWebhookSignature({rawBody, id, timestamp, signature: `v1,${signature}`, secret}), true);
  assert.equal(verifyResendWebhookSignature({rawBody, id, timestamp, signature: "v1,invalid", secret}), false);
});

test("Resend delivery and failure events map to accurate operational statuses", () => {
  assert.equal(mapResendEventStatus("email.delivered"), "Delivered");
  assert.equal(mapResendEventStatus("email.bounced"), "Bounced");
  assert.equal(mapResendEventStatus("email.complained"), "Complained");
  assert.equal(mapResendEventStatus("unknown"), null);
});

test("Resend handler, email retry and reconciliation actions contain replay and authorization guards", () => {
  const webhook = fs.readFileSync(new URL("../src/app/api/email/resend/webhook/route.ts", import.meta.url), "utf8");
  const service = fs.readFileSync(new URL("../src/lib/email/service.ts", import.meta.url), "utf8");
  const actions = fs.readFileSync(new URL("../src/actions/communications.ts", import.meta.url), "utf8");
  assert.match(webhook, /emailProviderEvent\.findUnique/);
  assert.match(webhook, /eventAt >= delivery\.latestEventAt/);
  assert.match(webhook, /unmatched provider message id/);
  assert.match(service, /60_000/);
  assert.match(service, /Bounced.*Complained/);
  assert.match(actions, /await requireStaff\(\)/);
  assert.match(actions, /createAuditLog/);
});

test("WhatsApp routes retain signature, known\/unknown routing, duplicate and outbound failure guards", () => {
  const inbound = fs.readFileSync(new URL("../src/app/api/whatsapp/webhook/route.ts", import.meta.url), "utf8");
  const outbound = fs.readFileSync(new URL("../src/lib/whatsapp/provider.ts", import.meta.url), "utf8");
  assert.match(inbound, /verifyMetaSignature/);
  assert.match(inbound, /duplicate: true/);
  assert.match(inbound, /contactEnquiry\.create/);
  assert.match(inbound, /buyerMessage\.create/);
  assert.match(inbound, /value\?\.statuses/);
  assert.match(inbound, /applyDeliveryStatus/);
  assert.match(inbound, /recordOperationalEvent/);
  assert.match(inbound, /status: 503/);
  assert.doesNotMatch(inbound, /raw: input\.raw/);
  assert.match(outbound, /WHATSAPP_CLOUD_ACCESS_TOKEN is not configured/);
  assert.match(outbound, /WhatsApp send failed/);
});

test("WhatsApp and contact enquiry destinations remain visible in admin navigation", () => {
  const navigation = fs.readFileSync(new URL("../src/data/adminNavigation.ts", import.meta.url), "utf8");
  const enquiries = fs.readFileSync(new URL("../src/app/admin/contact-enquiries/page.tsx", import.meta.url), "utf8");
  assert.match(navigation, /href: "\/admin\/whatsapp-inbox"/);
  assert.match(navigation, /href: "\/admin\/contact-enquiries"/);
  assert.match(enquiries, />Source</);
  assert.match(enquiries, /\{source\}/);
});

test("payment webhooks retain signature checks, reconciliation creation and idempotent settlement", () => {
  const paystackRoute = fs.readFileSync(new URL("../src/app/api/payments/webhook/route.ts", import.meta.url), "utf8");
  const flutterwaveRoute = fs.readFileSync(new URL("../src/app/api/payments/flutterwave/webhook/route.ts", import.meta.url), "utf8");
  assert.match(paystackRoute, /verifyPaystackSignature/);
  assert.match(paystackRoute, /verifyPaystackTransaction/);
  assert.match(flutterwaveRoute, /verifyFlutterwaveSignature/);
  assert.match(flutterwaveRoute, /verifyFlutterwaveTransaction/);
  for (const source of [paystackRoute, flutterwaveRoute]) {
    assert.match(source, /existingPayment/);
    assert.match(source, /createPaymentReconciliationIncident/);
    assert.match(source, /payment request not found/);
  }
});

test("delivery workflow retains partner scope, status propagation, buyer notification and audit evidence", () => {
  const actions = fs.readFileSync(new URL("../src/actions/createAdminRecords.ts", import.meta.url), "utf8");
  assert.match(actions, /deliveryPartnerId: partner\.id/);
  assert.match(actions, /fulfilmentStatus/);
  assert.match(actions, /Delivery update:/);
  assert.match(actions, /Updated delivery status/);
});

test("public forms persist before notification attempts and preserve group-buy interest", () => {
  const actions = fs.readFileSync(new URL("../src/actions/createAdminRecords.ts", import.meta.url), "utf8");
  for (const model of ["contactEnquiry.create", "buyerAccountRequest.create", "orderRequest.create"]) assert.match(actions, new RegExp(model.replace(".", "\\.")));
  assert.match(actions, /groupBuyInterest/);
  assert.ok(actions.indexOf("prisma.contactEnquiry.create") < actions.indexOf("contact-ack:"));
  assert.ok(actions.indexOf("prisma.buyerAccountRequest.create") < actions.indexOf("account-request-ack:"));
  assert.ok(actions.indexOf("prisma.orderRequest.create") < actions.indexOf("order-request-ack:"));
});
