import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  buyerOrderFinancialRelations,
  loadAuthorizedRecentReceipts,
  visibleBuyerPaymentStatus,
} from "../src/lib/buyerFinancialAccess.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function receiptDb(rows) {
  let calls = 0;
  return {
    db: {
      receipt: {
        async findMany() {
          calls += 1;
          return rows;
        },
      },
    },
    calls: () => calls,
  };
}

test("receipt-capable buyers receive the existing overview receipt data", async () => {
  const fixture = receiptDb([{id: "receipt-1", code: "RCT-000001", amount: 4200, status: "Issued"}]);
  const result = await loadAuthorizedRecentReceipts({
    db: fixture.db,
    customerId: "customer-1",
    canViewReceipts: true,
  });

  assert.equal(fixture.calls(), 1);
  assert.equal(result[0].code, "RCT-000001");
  assert.equal(visibleBuyerPaymentStatus(true, "Paid"), "Paid");
  assert.deepEqual(Object.keys(buyerOrderFinancialRelations(true)).sort(), ["paymentRequests", "payments", "receipts"]);
});

test("buyers without receipt permission receive no receipt summaries or restricted values", async () => {
  const fixture = receiptDb([{id: "receipt-secret", code: "RCT-SECRET", amount: 9900, status: "Issued"}]);
  const result = await loadAuthorizedRecentReceipts({
    db: fixture.db,
    customerId: "customer-1",
    canViewReceipts: false,
  });

  assert.deepEqual(result, []);
  assert.equal(fixture.calls(), 0, "the receipt query must be skipped entirely");
  assert.equal(visibleBuyerPaymentStatus(false, "Paid"), null);
  assert.deepEqual(buyerOrderFinancialRelations(false), {});
  assert.doesNotMatch(JSON.stringify(result), /RCT-SECRET|receipt-secret|9900|Issued/);
});

test("buyer overview and order pages omit financial sections for restricted contacts", () => {
  const overview = read("src/app/buyer-account/page.tsx");
  const orders = read("src/app/buyer-account/orders/page.tsx");
  const detail = read("src/app/buyer-account/orders/[id]/page.tsx");
  const frame = read("src/components/BuyerPortalFrame.tsx");

  assert.match(overview, /loadAuthorizedRecentReceipts/);
  assert.match(overview, /buyer\.canViewReceipts \? <Panel title="Recent receipts"/);
  assert.match(orders, /visibleBuyerPaymentStatus\(buyer\.canViewReceipts/);
  assert.match(detail, /buyerOrderFinancialRelations\(buyer\.canViewReceipts\)/);
  assert.match(detail, /buyer\.canViewReceipts \? <section/);
  assert.match(frame, /href !== "\/buyer-account\/payments"/);
});

test("the dedicated payment route remains server-side capability protected", () => {
  const payments = read("src/app/buyer-account/payments/page.tsx");
  const currentBuyer = read("src/lib/currentBuyer.ts");
  assert.match(payments, /requireBuyerCapability\("canViewReceipts"\)/);
  assert.match(currentBuyer, /if \(!result\.buyer\[capability\]\) redirect/);
});

test("neighbouring buyer permissions and authoritative session invalidation remain enforced", () => {
  const overview = read("src/app/buyer-account/page.tsx");
  const orderPage = read("src/app/buyer-account/order/page.tsx");
  const actions = read("src/actions/createAdminRecords.ts");
  const currentBuyer = read("src/lib/currentBuyer.ts");

  assert.match(overview, /buyer\.canViewCredit \? <Metric label="Available credit"/);
  assert.match(orderPage, /buyer\.canViewCredit \? <Metric label="Available credit"/);
  assert.match(orderPage, /requireBuyerCapability\("canPlaceOrders"\)/);
  assert.match(actions, /createBuyerPortalOrderAction[\s\S]*?requireBuyerCapability\("canPlaceOrders"\)/);
  assert.match(currentBuyer, /contact\.status === "Active"/);
  assert.match(currentBuyer, /contact\.updatedAt\.toISOString\(\) === contactRevision/);
  assert.match(currentBuyer, /verifySessionToken/);
});
