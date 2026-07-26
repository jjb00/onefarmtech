import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveGroupBuyState,
  isPaidGroupBuyReservationStatus,
  paidGroupBuyQuantity,
} from "../src/lib/groupBuyState.js";

test("unpaid reservations do not increase confirmed group-buy progress", () => {
  const reservations = [
    {quantity: 4, paymentStatus: "Unpaid"},
    {quantity: 3, paymentStatus: "Deposit paid"},
  ];

  assert.equal(paidGroupBuyQuantity(reservations), 0);

  const result = deriveGroupBuyState({
    currentStatus: "Open",
    minQuantity: 5,
    targetQuantity: 10,
    reservations,
  });

  assert.equal(result.reservedQuantity, 0);
  assert.equal(result.status, "Open");
  assert.equal(result.paymentStatus, "Collecting payments");
});

test("minimum paid quantity advances the campaign automatically", () => {
  const result = deriveGroupBuyState({
    currentStatus: "Open",
    minQuantity: 5,
    targetQuantity: 10,
    reservations: [
      {quantity: 3, paymentStatus: "Paid"},
      {quantity: 2, paymentStatus: "Approved"},
    ],
  });

  assert.equal(result.reservedQuantity, 5);
  assert.equal(result.status, "Minimum met");
  assert.equal(result.paymentStatus, "Minimum payments met");
});

test("paid target advances to fully reserved and fully paid", () => {
  const result = deriveGroupBuyState({
    currentStatus: "Open",
    minQuantity: 5,
    targetQuantity: 10,
    reservations: [
      {quantity: 6, paymentStatus: "Fully paid"},
      {quantity: 4, paymentStatus: "Paid"},
    ],
  });

  assert.equal(result.reservedQuantity, 10);
  assert.equal(result.status, "Fully reserved");
  assert.equal(result.paymentStatus, "Fully paid");
});

test("closing a funded group buy advances it to processing", () => {
  const result = deriveGroupBuyState({
    currentStatus: "Minimum met",
    requestedStatus: "Closed",
    minQuantity: 5,
    targetQuantity: 10,
    reservations: [{quantity: 5, paymentStatus: "Paid"}],
  });

  assert.equal(result.status, "Processing");
});

test("completed fulfilment completes the campaign", () => {
  const result = deriveGroupBuyState({
    currentStatus: "Processing",
    fulfilmentStatus: "Completed",
    minQuantity: 5,
    targetQuantity: 10,
    reservations: [{quantity: 10, paymentStatus: "Fully paid"}],
  });

  assert.equal(result.status, "Completed");
  assert.equal(result.paymentStatus, "Fully paid");
});

test("only confirmed full-payment states count as paid", () => {
  assert.equal(isPaidGroupBuyReservationStatus("Paid"), true);
  assert.equal(isPaidGroupBuyReservationStatus("Fully paid"), true);
  assert.equal(isPaidGroupBuyReservationStatus("Approved"), true);
  assert.equal(isPaidGroupBuyReservationStatus("Deposit paid"), false);
  assert.equal(isPaidGroupBuyReservationStatus("Refunded"), false);
});
