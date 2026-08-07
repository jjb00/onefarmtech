import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  fulfilmentStatusAfterPaymentConfirmed,
} from "../src/lib/orderStatusRules.js";

test("payment confirmation advances early pickup fulfilment", () => {
  assert.equal(
    fulfilmentStatusAfterPaymentConfirmed("Pickup", "Pending pickup"),
    "Confirmed",
  );
});

test("payment confirmation advances early delivery fulfilment", () => {
  for (const status of [
    "New order",
    "Buyer request",
    "WhatsApp order received",
  ]) {
    assert.equal(
      fulfilmentStatusAfterPaymentConfirmed("Platform delivery", status),
      "Confirmed",
    );
  }
});

test("payment confirmation never resets fulfilment already in progress", () => {
  for (const status of [
    "Confirmed",
    "Out for delivery",
    "Delivered",
    "Ready for pickup",
    "Picked up",
    "Delivery issue",
    "Cancelled",
  ]) {
    assert.equal(
      fulfilmentStatusAfterPaymentConfirmed("Platform delivery", status),
      status,
    );
  }
});

test("manual and provider payment confirmation use the same stage rule", () => {
  const actions = fs.readFileSync(
    new URL("../src/actions/createAdminRecords.ts", import.meta.url),
    "utf8",
  );

  const paystack = fs.readFileSync(
    new URL("../src/lib/payments/paystackSettlement.js", import.meta.url),
    "utf8",
  );

  const flutterwave = fs.readFileSync(
    new URL("../src/lib/payments/flutterwaveSettlement.js", import.meta.url),
    "utf8",
  );

  for (const source of [actions, paystack, flutterwave]) {
    assert.match(source, /fulfilmentStatusAfterPaymentConfirmed/);
    assert.match(source, /paymentStatus:\s*"Paid"/);
  }
});

test("delivery assignment and partner updates remain authoritative", () => {
  const actions = fs.readFileSync(
    new URL("../src/actions/createAdminRecords.ts", import.meta.url),
    "utf8",
  );
  const deliveryStatus = fs.readFileSync(
    new URL("../src/lib/deliveryStatus.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    actions,
    /partner \? "Out for delivery" : delivery\.order\.fulfilmentStatus/,
  );
  assert.match(deliveryStatus, /input\.status === "Delivered"\s*\n\s*\? "Delivered"/);
  assert.match(deliveryStatus, /input\.status === "Failed \/ issue"\s*\n\s*\? "Delivery issue"/);
});

test("order detail uses canonical Payments workspace", () => {
  const detail = fs.readFileSync(
    new URL("../src/app/admin/orders/[id]/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(detail, /href="\/admin\/payments"/);
  assert.doesNotMatch(detail, /href="\/admin\/payment-requests"/);
});
