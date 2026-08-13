import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {initialiseGroupBuyPayment} from "../src/lib/payments/groupBuyPaymentInitialization.js";
import {settleVerifiedGroupBuyPaystackPayment} from "../src/lib/payments/groupBuyPaystackSettlement.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function initializationFixture() {
  const state = {
    reservation: {
      id: "reservation-1",
      buyerName: "Ada",
      phone: "+2348012345678",
      email: "ada@example.test",
      quantity: 2,
      unitPrice: 7000,
      amount: 14000,
      paymentStatus: "Unpaid",
      groupBuy: {id: "group-1", code: "GB-0001", status: "Open"},
      paymentRequests: [],
    },
    requests: [],
  };
  const db = {
    state,
    groupBuyReservation: {
      findUnique: async () => ({...state.reservation, paymentRequests: [...state.requests]}),
      update: async ({data}) => Object.assign(state.reservation, data),
    },
    groupBuyPaymentRequest: {
      create: async ({data}) => {
        const row = {id: `request-${state.requests.length + 1}`, createdAt: new Date(), updatedAt: new Date(), paidAt: null, paymentUrl: null, ...data};
        state.requests.push(row);
        return row;
      },
      update: async ({where, data}) => {
        const row = state.requests.find((item) => item.id === where.id);
        Object.assign(row, data, {updatedAt: new Date()});
        return row;
      },
      updateMany: async ({where, data}) => {
        let count = 0;
        for (const row of state.requests) {
          if (row.id !== where.id.not && !row.paidAt && ["Pending", "Initialising"].includes(row.status)) {
            Object.assign(row, data);
            count += 1;
          }
        }
        return {count};
      },
    },
    $transaction: async (work) => work(db),
  };
  return {state, db};
}

test("group-buy checkout charges the immutable reservation amount and uses a buyer-safe return URL", async () => {
  const {state, db} = initializationFixture();
  let checkoutInput;
  const result = await initialiseGroupBuyPayment({
    db,
    reservationId: state.reservation.id,
    referenceFactory: () => "PAY-GB-0001-UNIQUE",
    createCheckout: async (input) => {
      checkoutInput = input;
      return {provider: "Paystack", paymentUrl: "https://checkout.paystack.com/group-buy", gatewayReference: input.reference, httpStatus: 200};
    },
  });

  assert.equal(result.paymentRequest.status, "Pending");
  assert.equal(checkoutInput.amount, 14000);
  assert.equal(checkoutInput.buyerEmail, "ada@example.test");
  assert.match(checkoutInput.callbackPath, /^\/api\/group-buy-payments\/return\?reference=/);
  assert.equal(checkoutInput.metadata.chargedUnitPrice, 7000);
  assert.equal(state.reservation.paymentStatus, "Payment pending");
});

test("a recent pending group-buy checkout is reused instead of double-created", async () => {
  const {state, db} = initializationFixture();
  state.requests.push({id: "existing", reference: "PAY-EXISTING", status: "Pending", paymentUrl: "https://checkout.paystack.com/existing", paidAt: null, createdAt: new Date(), updatedAt: new Date(), expiresAt: new Date(Date.now() + 60_000)});
  let calls = 0;
  const result = await initialiseGroupBuyPayment({db, reservationId: state.reservation.id, createCheckout: async () => {calls += 1;}});
  assert.equal(result.reused, true);
  assert.equal(result.paymentRequest.reference, "PAY-EXISTING");
  assert.equal(calls, 0);
});

function settlementFixture({status = "Open", targetQuantity = 10, otherPaidQuantity = 0} = {}) {
  const state = {
    request: {id: "request-1", reference: "PAY-GB-0001", gatewayReference: "PAY-GB-0001", amount: 14000, currency: "NGN", status: "Pending", paidAt: null},
    reservation: {id: "reservation-1", groupBuyId: "group-1", buyerName: "Ada", phone: "+2348012345678", quantity: 2, unitPrice: 7000, amount: 14000, paymentStatus: "Payment pending"},
    groupBuy: {id: "group-1", code: "GB-0001", status, minQuantity: 1, targetQuantity, fulfilmentStatus: "Planning", reservedQuantity: otherPaidQuantity},
    other: otherPaidQuantity ? [{id: "other", quantity: otherPaidQuantity, paymentStatus: "Paid"}] : [],
    audits: [],
  };
  const nestedRequest = () => ({...state.request, reservation: {...state.reservation, paymentRequests: [{...state.request}], groupBuy: {...state.groupBuy, reservations: [...state.other, {...state.reservation}]}}});
  const db = {
    groupBuyPaymentRequest: {
      findUnique: async () => nestedRequest(),
      update: async ({data}) => Object.assign(state.request, data),
    },
    groupBuyReservation: {update: async ({data}) => Object.assign(state.reservation, data)},
    groupBuy: {update: async ({data}) => Object.assign(state.groupBuy, data)},
    auditLog: {create: async ({data}) => {state.audits.push(data); return data;}},
    $transaction: async (work) => work(db),
  };
  const verification = {ok: true, status: "success", reference: state.request.reference, amountMinor: 1_400_000, currency: "NGN", providerId: "paystack-1", metadata: {}};
  return {state, db, verification};
}

test("verified Paystack payment confirms the reservation and advances real group-buy state", async () => {
  const {state, db, verification} = settlementFixture();
  const result = await settleVerifiedGroupBuyPaystackPayment({db, paymentRequest: state.request, verification});
  assert.equal(result.ok, true);
  assert.equal(result.reviewRequired, false);
  assert.equal(state.request.status, "Paid");
  assert.equal(state.reservation.paymentStatus, "Paid");
  assert.equal(state.groupBuy.reservedQuantity, 2);
  assert.equal(state.audits.length, 1);

  const duplicate = await settleVerifiedGroupBuyPaystackPayment({db, paymentRequest: state.request, verification});
  assert.equal(duplicate.duplicate, true);
  assert.equal(state.audits.length, 1);
});

test("late or over-capacity payments are recorded for refund review, never counted as confirmed demand", async () => {
  for (const fixtureOptions of [
    {status: "Closed", targetQuantity: 10, otherPaidQuantity: 0},
    {status: "Open", targetQuantity: 10, otherPaidQuantity: 9},
  ]) {
    const {state, db, verification} = settlementFixture(fixtureOptions);
    const result = await settleVerifiedGroupBuyPaystackPayment({db, paymentRequest: state.request, verification});
    assert.equal(result.ok, true);
    assert.equal(result.reviewRequired, true);
    assert.equal(state.request.status, "Paid — refund review");
    assert.equal(state.reservation.paymentStatus, "Refund pending");
    assert.equal(state.groupBuy.reservedQuantity, fixtureOptions.otherPaidQuantity);
  }
});

test("a second paid checkout for one reservation is isolated for refund without unconfirming the original reservation", async () => {
  const {state, db, verification} = settlementFixture();
  state.reservation.paymentStatus = "Paid";
  state.groupBuy.reservedQuantity = 2;
  db.groupBuyPaymentRequest.findUnique = async () => ({
    ...state.request,
    reservation: {
      ...state.reservation,
      paymentRequests: [
        {...state.request},
        {id: "older-paid-request", status: "Paid", paidAt: new Date()},
      ],
      groupBuy: {
        ...state.groupBuy,
        reservations: [{...state.reservation}],
      },
    },
  });

  const result = await settleVerifiedGroupBuyPaystackPayment({db, paymentRequest: state.request, verification});
  assert.equal(result.reviewRequired, true);
  assert.equal(result.duplicateCharge, true);
  assert.equal(state.request.status, "Paid — refund review");
  assert.equal(state.reservation.paymentStatus, "Paid");
  assert.equal(state.groupBuy.reservedQuantity, 2);
});

test("the signed Paystack webhook handles group-buy references and the admin can recover manually", () => {
  const webhook = read("src/app/api/payments/webhook/route.ts");
  const actions = read("src/actions/groupBuys.ts");
  const admin = read("src/app/admin/group-buys/page.tsx");

  assert.match(webhook, /groupBuyPaymentRequest\.findFirst/);
  assert.match(webhook, /settleVerifiedGroupBuyPaystackPayment/);
  assert.match(actions, /generateGroupBuyPaymentLinkAction/);
  assert.match(actions, /verifyGroupBuyPaystackPaymentAction/);
  assert.match(admin, /Generate Paystack link/);
  assert.match(admin, /Send link on WhatsApp/);
});
