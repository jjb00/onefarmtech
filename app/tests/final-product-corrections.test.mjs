import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("order detail imports pickup helper and completed orders open safely", () => {
  const detail = read("src/app/admin/orders/[id]/page.tsx");
  const orders = read("src/app/admin/orders/page.tsx");

  assert.match(detail, /fulfilmentStatusesFor,\s*isPickupMethod/);
  assert.match(orders, /\["Delivered", "Collected", "Completed", "Cancelled"\]/);
  assert.match(orders, /return "Open order"/);
});

test("payments use summary cards without duplicate primary tabs", () => {
  const payments = read("src/app/admin/payments/page.tsx");

  assert.match(payments, /AdminCompactMetric/);
  assert.match(payments, /\["all", "All payments"\]/);
  assert.doesNotMatch(payments, /\["pending", "Pending"\]/);
  assert.match(payments, /View receipt/);
  assert.match(payments, /Retry receipt/);
  assert.match(payments, /Manual payment backup/);
});

test("manual paid payment automatically creates an idempotent receipt", () => {
  const actions = read("src/actions/createAdminRecords.ts");

  assert.match(actions, /automaticReceiptCode/);
  assert.match(actions, /prisma\.receipt\.upsert/);
  assert.match(actions, /paymentStatus:\s*"Paid"/);
});

test("all buyer detail pages use simplified controls", () => {
  const buyer = read("src/app/admin/customers/[id]/page.tsx");

  assert.match(buyer, /Account controls/);
  assert.match(buyer, /Allow buyer portal login/);
  assert.match(buyer, /Credit hold/);
  assert.match(buyer, /Archived/);
  assert.doesNotMatch(buyer, /Manual account settings/);
  assert.doesNotMatch(buyer, /bounded to 25 records/);
});

test("impact page and loading states exist", () => {
  assert.match(read("src/app/impact/page.tsx"), /Our impact/);
  assert.match(read("src/components/PublicFooter.tsx"), /\/impact/);

  for (const path of [
    "src/app/admin/loading.tsx",
    "src/app/admin/orders/loading.tsx",
    "src/app/admin/payments/loading.tsx",
    "src/app/admin/customers/loading.tsx",
  ]) {
    assert.match(read(path), /Loading/);
  }
});

test("retired heavy pages redirect to canonical workspaces", () => {
  const expected = {
    "src/app/admin/operations/page.tsx": "/admin/orders",
    "src/app/admin/order-requests/page.tsx": "/admin/orders?view=new-requests",
    "src/app/admin/payment-requests/page.tsx": "/admin/payments",
    "src/app/admin/buyer-accounts/page.tsx": "/admin/customers",
    "src/app/admin/guest-buyers/page.tsx": "/admin/customers?view=all",
    "src/app/admin/whatsapp-inbox/page.tsx": "/admin/buyer-messages",
  };

  for (const [path, destination] of Object.entries(expected)) {
    assert.match(read(path), /redirect\(/);
    assert.ok(read(path).includes(destination));
  }
});
