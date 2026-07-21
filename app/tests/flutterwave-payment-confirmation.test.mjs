import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import {settleVerifiedFlutterwavePayment} from "../src/lib/payments/flutterwaveSettlement.js";
import {validateFlutterwaveWebhookPayment, verifyFlutterwaveWebhookSignature} from "../src/lib/payments/flutterwaveWebhookRules.js";

function fixture() {
  const state = {request: {id: "fw-1", orderId: "order-8", customerId: "customer-8", provider: "Flutterwave", reference: "PAY-OFT-00008-MRUG89QU-49D55948", gatewayReference: "PAY-OFT-00008-MRUG89QU-49D55948", amount: 100000, currency: "NGN", status: "Pending", paidAt: null, order: {buyerName: "Buyer"}, customer: {name: "Buyer", email: "buyer@example.com"}}, order: {paymentStatus: "Payment pending"}, payments: new Map(), receipts: new Map(), audits: []};
  const db = {
    paymentRequest: {findUnique: async () => ({...state.request}), update: async ({data}) => (state.request = {...state.request, ...data})},
    payment: {upsert: async ({where, create, update}) => { const old = state.payments.get(where.reference); const value = old ? {...old, ...update} : {id: `payment-${state.payments.size + 1}`, ...create}; state.payments.set(where.reference, value); return value; }},
    order: {update: async ({data}) => (state.order = {...state.order, ...data})}, auditLog: {create: async ({data}) => { state.audits.push(data); return data; }},
    receipt: {upsert: async ({where, create, update}) => { const old = state.receipts.get(where.code); const value = old ? {...old, ...update} : {id: `receipt-${state.receipts.size + 1}`, ...create}; state.receipts.set(where.code, value); return value; }},
    $transaction: async (work) => work(db),
  };
  const verification = {ok: true, status: "successful", reference: state.request.reference, amount: 100000, currency: "NGN", providerId: "10385708", metadata: {}};
  return {state, db, verification};
}

test("successful Flutterwave settlement updates PaymentRequest, Order, Payment, Receipt and audit", async () => {
  const {state, db, verification} = fixture(); const result = await settleVerifiedFlutterwavePayment({db, paymentRequest: state.request, verification});
  assert.equal(result.ok, true); assert.equal(state.request.status, "Paid"); assert.equal(state.order.paymentStatus, "Paid"); assert.equal(state.payments.size, 1); assert.equal(state.receipts.size, 1); assert.equal(state.audits.length, 1);
});

test("Flutterwave current HMAC signature and legacy hash are validated", () => {
  const rawBody = JSON.stringify({event: "charge.completed"}); const secretHash = "secret-hash"; const signature = crypto.createHmac("sha256", secretHash).update(rawBody).digest("base64");
  assert.equal(verifyFlutterwaveWebhookSignature({rawBody, signature, secretHash}), true);
  assert.equal(verifyFlutterwaveWebhookSignature({rawBody, signature: "wrong", secretHash}), false);
  assert.equal(verifyFlutterwaveWebhookSignature({rawBody, legacyHash: secretHash, secretHash}), true);
});

test("Flutterwave webhook amount and currency must match", () => {
  assert.equal(validateFlutterwaveWebhookPayment({data: {amount: 100000, currency: "NGN"}, expectedAmount: 100000, expectedCurrency: "NGN"}), null);
  assert.equal(validateFlutterwaveWebhookPayment({data: {amount: 99999, currency: "NGN"}, expectedAmount: 100000, expectedCurrency: "NGN"}), "amount-mismatch");
  assert.equal(validateFlutterwaveWebhookPayment({data: {amount: 100000, currency: "USD"}, expectedAmount: 100000, expectedCurrency: "NGN"}), "currency-mismatch");
});

test("duplicate Flutterwave settlement is idempotent", async () => {
  const {state, db, verification} = fixture(); await settleVerifiedFlutterwavePayment({db, paymentRequest: state.request, verification}); const second = await settleVerifiedFlutterwavePayment({db, paymentRequest: state.request, verification});
  assert.equal(second.duplicate, true); assert.equal(state.payments.size, 1); assert.equal(state.receipts.size, 1); assert.equal(state.audits.length, 1);
});

test("wrong Flutterwave verification cannot mark paid", async () => {
  const {state, db, verification} = fixture(); verification.amount = 1; const result = await settleVerifiedFlutterwavePayment({db, paymentRequest: state.request, verification}); assert.equal(result.ok, false); assert.equal(state.request.status, "Pending");
});

test("receipt failure does not roll back verified Flutterwave payment", async () => {
  const {state, db, verification} = fixture(); db.receipt.upsert = async () => { throw new Error("receipt failed"); }; const result = await settleVerifiedFlutterwavePayment({db, paymentRequest: state.request, verification}); assert.equal(result.receiptError, "receipt failed"); assert.equal(state.request.status, "Paid"); assert.equal(state.order.paymentStatus, "Paid");
});

test("manual Flutterwave recovery verifies by tx_ref and is finance restricted", () => {
  const source = fs.readFileSync(new URL("../src/actions/verifyFlutterwavePayment.ts", import.meta.url), "utf8"); assert.match(source, /requireStaff/); assert.match(source, /Super admin.*Admin.*Finance/); assert.match(source, /verifyFlutterwaveTransactionByReference/); assert.match(source, /settleVerifiedFlutterwavePayment/);
});

test("Flutterwave webhook revalidates operational pages", () => {
  const source = fs.readFileSync(new URL("../src/app/api/payments/flutterwave/webhook/route.ts", import.meta.url), "utf8"); for (const path of ["/admin/payment-requests", "/admin/orders", "/admin/payments", "/admin/receipts"]) assert.match(source, new RegExp(path.replaceAll("/", "\\/"))); assert.match(source, /revalidatePath/);
});
