import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import {settleVerifiedPaystackPayment} from "../src/lib/payments/paystackSettlement.js";
import {validatePaystackWebhookPayment, verifyPaystackWebhookSignature} from "../src/lib/payments/paystackWebhookRules.js";

function fixture() {
  const state = {
    request: {id: "pr-1", orderId: "order-1", customerId: "customer-1", provider: "Paystack", reference: "PAY-OFT-00009-MRUCA6SK-2FF80365", gatewayReference: "PAY-OFT-00009-MRUCA6SK-2FF80365", amount: 75000, currency: "NGN", status: "Pending", paidAt: null, order: {buyerName: "Buyer"}, customer: {name: "Buyer", email: "buyer@example.com"}},
    order: {id: "order-1", paymentStatus: "Payment pending"}, payments: new Map(), receipts: new Map(), audits: [],
  };
  const db = {
    paymentRequest: {
      findUnique: async () => ({...state.request}),
      update: async ({data}) => (state.request = {...state.request, ...data}),
    },
    payment: {upsert: async ({where, create, update}) => {
      const existing = state.payments.get(where.reference);
      const value = existing ? {...existing, ...update} : {id: `payment-${state.payments.size + 1}`, ...create};
      state.payments.set(where.reference, value); return value;
    }},
    order: {update: async ({data}) => (state.order = {...state.order, ...data})},
    auditLog: {create: async ({data}) => { state.audits.push(data); return data; }},
    receipt: {upsert: async ({where, create, update}) => {
      const existing = state.receipts.get(where.code); const value = existing ? {...existing, ...update} : {id: `receipt-${state.receipts.size + 1}`, ...create};
      state.receipts.set(where.code, value); return value;
    }},
    $transaction: async (work) => work(db),
  };
  const verification = {ok: true, status: "success", reference: state.request.reference, amountMinor: 7500000, currency: "NGN", providerId: "6377140798", metadata: {}};
  return {state, db, verification};
}

test("successful Paystack settlement updates the PaymentRequest and Order", async () => {
  const {state, db, verification} = fixture();
  const result = await settleVerifiedPaystackPayment({db, paymentRequest: state.request, verification});
  assert.equal(result.ok, true); assert.equal(state.request.status, "Paid"); assert.equal(state.order.paymentStatus, "Paid");
});

test("new unique Paystack references resolve without legacy parsing", async () => {
  const {state, db, verification} = fixture();
  const result = await settleVerifiedPaystackPayment({db, paymentRequest: state.request, verification});
  assert.equal(result.payment.reference, "PAY-OFT-00009-MRUCA6SK-2FF80365");
});

test("Paystack webhook amount comparison uses kobo", () => {
  assert.equal(validatePaystackWebhookPayment({data: {amount: 7500000, currency: "NGN"}, expectedAmount: 75000, expectedCurrency: "NGN"}), null);
  assert.equal(validatePaystackWebhookPayment({data: {amount: 75000, currency: "NGN"}, expectedAmount: 75000, expectedCurrency: "NGN"}), "amount-mismatch");
});

test("duplicate successful settlement is idempotent and creates one receipt", async () => {
  const {state, db, verification} = fixture();
  await settleVerifiedPaystackPayment({db, paymentRequest: state.request, verification});
  const second = await settleVerifiedPaystackPayment({db, paymentRequest: state.request, verification});
  assert.equal(second.duplicate, true); assert.equal(state.payments.size, 1); assert.equal(state.receipts.size, 1); assert.equal(state.audits.length, 1);
});

test("invalid Paystack signatures are rejected and the secret key signs correctly", () => {
  const body = JSON.stringify({event: "charge.success"}); const secret = "sk_test_correct";
  const signature = crypto.createHmac("sha512", secret).update(body).digest("hex");
  assert.equal(verifyPaystackWebhookSignature(body, signature, secret), true);
  assert.equal(verifyPaystackWebhookSignature(body, signature, "separate-webhook-secret"), false);
  assert.equal(verifyPaystackWebhookSignature(body, "short", secret), false);
});

test("wrong verified amount does not mark the payment paid", async () => {
  const {state, db, verification} = fixture(); verification.amountMinor = 7499999;
  const result = await settleVerifiedPaystackPayment({db, paymentRequest: state.request, verification});
  assert.equal(result.ok, false); assert.equal(result.conflict, "amount-mismatch"); assert.equal(state.request.status, "Pending");
});

test("receipt failure occurs after paid state and cannot revert it", async () => {
  const {state, db, verification} = fixture(); db.receipt.upsert = async () => { throw new Error("receipt unavailable"); };
  const result = await settleVerifiedPaystackPayment({db, paymentRequest: state.request, verification});
  assert.equal(result.ok, true); assert.equal(result.receiptError, "receipt unavailable"); assert.equal(state.request.status, "Paid"); assert.equal(state.order.paymentStatus, "Paid");
});

test("manual recovery securely verifies with Paystack before settlement", () => {
  const source = fs.readFileSync(new URL("../src/actions/verifyPaystackPayment.ts", import.meta.url), "utf8");
  assert.match(source, /requireStaff/); assert.match(source, /Super admin.*Admin.*Finance/); assert.match(source, /verifyPaystackTransaction/); assert.match(source, /settleVerifiedPaystackPayment/);
});

test("WhatsApp Read remains independent from payment confirmation", () => {
  const route = fs.readFileSync(new URL("../src/app/api/payments/webhook/route.ts", import.meta.url), "utf8");
  const settlement = fs.readFileSync(new URL("../src/lib/payments/paystackSettlement.js", import.meta.url), "utf8");
  assert.doesNotMatch(route, /buyerMessage.*status.*Read/s); assert.doesNotMatch(settlement, /buyerMessage/);
});

test("successful confirmation revalidates payment, order, receipt and dashboard pages", () => {
  const route = fs.readFileSync(new URL("../src/app/api/payments/webhook/route.ts", import.meta.url), "utf8");
  for (const path of ["/admin/payment-requests", "/admin/orders", "/admin/payments", "/admin/receipts", "/admin"]) assert.match(route, new RegExp(path.replaceAll("/", "\\/")));
  assert.match(route, /revalidatePath/);
});
