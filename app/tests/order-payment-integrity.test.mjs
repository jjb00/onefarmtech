import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {createPaystackCheckout} from "../src/lib/payments/paystack.ts";
import {freshPaymentReference, initialisePayment, isReusablePaymentRequest} from "../src/lib/payments/paymentInitialization.js";
import {fulfilmentStatusesFor, initialFulfilmentStatus, validateFulfilmentStatus, validateOrderStatusTransition} from "../src/lib/orderStatusRules.js";

test("canonical Orders query includes website, WhatsApp and admin Order rows without source filtering", () => {
  const data = fs.readFileSync(new URL("../src/data/dbOrders.ts", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../src/app/admin/orders/page.tsx", import.meta.url), "utf8");
  const conversion = fs.readFileSync(new URL("../src/lib/orderRequestConversion.js", import.meta.url), "utf8");
  const actions = fs.readFileSync(new URL("../src/actions/createAdminRecords.ts", import.meta.url), "utf8");
  const admin = fs.readFileSync(new URL("../src/actions/createOrder.ts", import.meta.url), "utf8");
  assert.match(data, /prisma\.order\.findMany\(\{\s*orderBy:/);
  assert.doesNotMatch(data, /findMany\(\{\s*where:/);
  for (const source of [conversion, actions, admin]) assert.match(source, /(?:tx|prisma)\.order\.create/);
  assert.match(actions, /source: "WhatsApp"/);
  assert.match(page, /dynamic = "force-dynamic"/);
});

test("Paystack initialization sends kobo, NGN, callback, unique reference and returns provider authorization URL", async () => {
  const previousKey = process.env.PAYSTACK_SECRET_KEY;
  process.env.PAYSTACK_SECRET_KEY = "sk_test_example";
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (_url, options) => {
    request = JSON.parse(options.body);
    return {ok: true, status: 200, json: async () => ({status: true, data: {authorization_url: "https://checkout.paystack.com/fresh", reference: request.reference, access_code: "fresh"}})};
  };
  try {
    const result = await createPaystackCheckout({reference: "PAY-FRESH-1", amount: 75000, currency: "NGN", email: "buyer@example.test", callbackUrl: "https://onefarmtech.com/payments/callback"});
    assert.equal(request.amount, 7_500_000);
    assert.equal(request.currency, "NGN");
    assert.equal(request.callback_url, "https://onefarmtech.com/payments/callback");
    assert.equal(result.paymentUrl, "https://checkout.paystack.com/fresh");
  } finally {
    global.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.PAYSTACK_SECRET_KEY; else process.env.PAYSTACK_SECRET_KEY = previousKey;
  }
  assert.notEqual(freshPaymentReference("OFT-1", () => 1, () => "aaaaaaaa-0000"), freshPaymentReference("OFT-1", () => 1, () => "bbbbbbbb-0000"));
});

function paymentDb(status = "Pending", overrides = {}) {
  const source = {id: "old", orderId: "order-1", customerId: null, provider: "Paystack", reference: "OLD", amount: 75000, currency: "NGN", status, paidAt: status === "Paid" ? new Date() : null, paymentUrl: null, expiresAt: null, order: {id: "order-1", code: "OFT-1", buyerName: "Buyer", phone: "+2341"}, customer: null, ...overrides};
  const state = {requests: [source], order: {...source.order, paymentStatus: "Unpaid"}, providerCalls: 0};
  const db = {state, paymentRequest: {
    findUnique: async () => source,
    findFirst: async () => [...state.requests].reverse().find((item) => isReusablePaymentRequest(item)) || null,
    create: async ({data}) => {const row = {id: `attempt-${state.requests.length}`, ...data}; state.requests.push(row); return row;},
    update: async ({where, data}) => {const row = state.requests.find((item) => item.id === where.id); Object.assign(row, data); return row;},
    updateMany: async ({where, data}) => {let count = 0; for (const row of state.requests) if (row.id !== where.id.not && !row.paidAt && ["Pending", "Initialising"].includes(row.status)) {Object.assign(row, data); count += 1;} return {count};},
  }, order: {update: async ({data}) => Object.assign(state.order, data)}, $transaction: async (callback) => callback(db), $queryRawUnsafe: async () => []};
  return db;
}

test("repeated payment initialization reuses one valid active provider link", async () => {
  const db = paymentDb();
  const createCheckout = async (input) => {db.state.providerCalls += 1; return {provider: "Paystack", paymentUrl: "https://checkout.paystack.com/new", gatewayReference: input.reference};};
  const first = await initialisePayment({db, paymentRequestId: "old", provider: "Paystack", referenceFactory: () => "PAY-NEW", createCheckout});
  const second = await initialisePayment({db, paymentRequestId: "old", provider: "Paystack", referenceFactory: () => "PAY-OTHER", createCheckout});
  assert.equal(first.reused, false); assert.equal(second.reused, true);
  assert.equal(second.paymentRequest.reference, "PAY-NEW"); assert.equal(db.state.providerCalls, 1);
  assert.equal(db.state.requests.filter((item) => item.status === "Pending").length, 1);
});

test("failed initialization records a failed attempt without a false successful payment", async () => {
  const db = paymentDb();
  await assert.rejects(() => initialisePayment({db, paymentRequestId: "old", provider: "Paystack", referenceFactory: () => "PAY-FAILED", createCheckout: async () => {throw new Error("provider rejected");}}), (error) => error.code === "provider-failed" && !error.message.includes("rejected"));
  assert.equal(db.state.requests.at(-1).status, "Failed");
  assert.equal(db.state.requests.at(-1).paymentUrl, null);
  assert.equal(db.state.order.paymentStatus, "Unpaid");
});

test("paid links are never reused and expired links receive a fresh attempt", async () => {
  await assert.rejects(() => initialisePayment({db: paymentDb("Paid"), paymentRequestId: "old", provider: "Paystack", createCheckout: async () => null}), (error) => error.code === "already-paid");
  const db = paymentDb("Pending", {paymentUrl: "https://checkout.paystack.com/expired", expiresAt: new Date("2020-01-01")});
  const result = await initialisePayment({db, paymentRequestId: "old", provider: "Paystack", now: () => new Date("2025-01-01"), referenceFactory: () => "PAY-FRESH", createCheckout: async (input) => ({provider: "Paystack", paymentUrl: "https://checkout.paystack.com/fresh", gatewayReference: input.reference})});
  assert.equal(result.reused, false); assert.equal(result.paymentRequest.reference, "PAY-FRESH");
});

test("pickup and payment workflows remain independent and operationally valid", () => {
  assert.equal(initialFulfilmentStatus("Pickup"), "Pending pickup");
  assert.equal(validateFulfilmentStatus("Pickup", "Delivered"), "pickup-cannot-be-delivered");
  assert.equal(validateFulfilmentStatus("Pickup", "Ready for pickup"), null);
  assert.equal(validateFulfilmentStatus("Pickup", "Collected"), null);
  assert.deepEqual(fulfilmentStatusesFor("Pickup"), ["Pending pickup", "Confirmed", "Preparing", "Ready for pickup", "Collected", "Cancelled"]);
  const order = {paymentStatus: "Unpaid", fulfilmentStatus: initialFulfilmentStatus("Pickup")};
  order.fulfilmentStatus = "Ready for pickup";
  assert.equal(order.paymentStatus, "Unpaid");
  order.paymentStatus = "Paid";
  assert.equal(order.fulfilmentStatus, "Ready for pickup");
});

test("status rules allow forward pickup and delivery progress but reject regressions", () => {
  assert.equal(validateOrderStatusTransition({deliveryMethod: "Pickup", currentPaymentStatus: "Paid", nextPaymentStatus: "Paid", currentFulfilmentStatus: "Pending pickup", nextFulfilmentStatus: "Ready for pickup"}), null);
  assert.equal(validateOrderStatusTransition({deliveryMethod: "Platform delivery", currentPaymentStatus: "Payment pending", nextPaymentStatus: "Paid", currentFulfilmentStatus: "Confirmed", nextFulfilmentStatus: "Out for delivery"}), null);
  assert.equal(validateOrderStatusTransition({deliveryMethod: "Platform delivery", currentPaymentStatus: "Paid", nextPaymentStatus: "Unpaid", currentFulfilmentStatus: "Delivered", nextFulfilmentStatus: "Confirmed"}), "payment-status-regression");
  assert.equal(validateFulfilmentStatus("Platform delivery", "Ready for pickup"), "delivery-cannot-use-pickup-status");
});

test("UI and actions keep pickup, payment and delivery assignment independent", () => {
  const orders = fs.readFileSync(new URL("../src/app/admin/orders/page.tsx", import.meta.url), "utf8");
  const detail = fs.readFileSync(new URL("../src/app/admin/orders/[id]/page.tsx", import.meta.url), "utf8");
  const payments = fs.readFileSync(new URL("../src/app/admin/payment-requests/page.tsx", import.meta.url), "utf8");
  const actions = fs.readFileSync(new URL("../src/actions/createAdminRecords.ts", import.meta.url), "utf8");
  for (const source of [orders, detail, payments]) { assert.match(source, /paymentStatus/); assert.match(source, /fulfilmentStatus/); }
  assert.match(actions, /pickup-does-not-use-delivery-assignment/);
  assert.match(actions, /initialisePayment/);
  assert.match(actions, /requireStaff/);
});

test("existing order detail links continue to resolve IDs and legacy codes", () => {
  const detail = fs.readFileSync(new URL("../src/app/admin/orders/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(detail, /where: \{OR: \[\{id\}, \{code: id\}\]\}/);
});
