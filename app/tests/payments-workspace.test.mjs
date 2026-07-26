import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  filterPaymentGroups,
  groupPaymentRequestsByOrder,
  paymentWorkspaceStatus,
} from "../src/lib/paymentWorkspace.js";

const request = (overrides = {}) => ({
  id: "request-1",
  orderId: "order-1",
  provider: "Paystack",
  reference: "PAY-1",
  amount: 75000,
  status: "Pending",
  paidAt: null,
  createdAt: new Date("2026-07-01T10:00:00Z"),
  updatedAt: new Date("2026-07-01T10:00:00Z"),
  order: {
    id: "order-1",
    code: "OFT-1",
    buyerName: "Buyer",
    phone: "+2341",
  },
  customer: null,
  ...overrides,
});

test("payment attempts are grouped into one obligation per order", () => {
  const groups = groupPaymentRequestsByOrder([
    request({id: "old", status: "Failed"}),
    request({
      id: "new",
      reference: "PAY-2",
      createdAt: new Date("2026-07-02T10:00:00Z"),
      updatedAt: new Date("2026-07-02T10:00:00Z"),
    }),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].current.id, "new");
  assert.deepEqual(
    groups[0].attempts.map((attempt) => attempt.id),
    ["new", "old"],
  );
});

test("paid attempt is authoritative even when later failed attempts exist", () => {
  const groups = groupPaymentRequestsByOrder([
    request({
      id: "paid",
      status: "Paid",
      paidAt: new Date("2026-07-02T10:00:00Z"),
    }),
    request({
      id: "failed",
      status: "Failed",
      createdAt: new Date("2026-07-03T10:00:00Z"),
      updatedAt: new Date("2026-07-03T10:00:00Z"),
    }),
  ]);

  assert.equal(groups[0].current.id, "paid");
  assert.equal(paymentWorkspaceStatus(groups[0]), "paid");
});

test("workspace filters operate on grouped obligations", () => {
  const groups = groupPaymentRequestsByOrder([
    request(),
    request({
      id: "request-2",
      orderId: "order-2",
      status: "Failed",
      provider: "Flutterwave",
      order: {
        id: "order-2",
        code: "OFT-2",
        buyerName: "Second buyer",
        phone: "+2342",
      },
    }),
  ]);

  assert.equal(
    filterPaymentGroups(groups, {
      view: "needs-action",
      provider: "all",
      query: "",
    }).length,
    1,
  );

  assert.equal(
    filterPaymentGroups(groups, {
      view: "all",
      provider: "flutterwave",
      query: "second",
    }).length,
    1,
  );
});

test("Payments is canonical and legacy requests redirect", () => {
  const payments = fs.readFileSync(
    new URL("../src/app/admin/payments/page.tsx", import.meta.url),
    "utf8",
  );

  const legacy = fs.readFileSync(
    new URL("../src/app/admin/payment-requests/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(payments, /groupPaymentRequestsByOrder/);
  assert.match(payments, /Payment history/);
  assert.match(payments, /Retry same link/);
  assert.match(payments, /verifyPaystackPaymentAction/);
  assert.match(payments, /verifyFlutterwavePaymentAction/);
  assert.match(legacy, /\/admin\/payments/);
});
