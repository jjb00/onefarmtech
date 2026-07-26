import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("admin shell uses plain staff-facing language", () => {
  const header = read("src/components/admin/AdminPageHeader.tsx");
  const layout = read("src/components/admin/AdminLayoutFrame.tsx");
  assert.doesNotMatch(header, /Operations desk/i);
  assert.doesNotMatch(layout, /Daily work, WhatsApp storefront|Session details|Access status/);
});

test("Today contains only actionable queues", () => {
  const page = read("src/app/admin/page.tsx");
  assert.match(page, /title="Today"/);
  assert.match(page, /New order requests/);
  assert.match(page, /Orders needing action/);
  assert.match(page, /Payment follow-up/);
  assert.match(page, /Messages needing a reply/);
  assert.doesNotMatch(page, /Company dashboard|Control readiness|Routine automation|Buyer account attention/);
});

test("orders use four primary views and hide destructive row controls", () => {
  const page = read("src/app/admin/orders/page.tsx");
  assert.match(page, /Needs action/);
  assert.match(page, /New requests/);
  assert.match(page, /In fulfilment/);
  assert.match(page, /Completed/);
  assert.doesNotMatch(page, /Awaiting payment|All orders|AdminRecordControls|Delete permanently/);
});

test("buyer, payment and message pages avoid internal planning language", () => {
  const guest = read("src/app/admin/guest-buyers/page.tsx");
  const messages = read("src/app/admin/buyer-messages/page.tsx");
  const payments = read("src/app/admin/payment-requests/page.tsx");
  assert.doesNotMatch(guest, /Guest intelligence|bounded recent view/i);
  assert.doesNotMatch(messages, /WhatsApp exceptions|Routine automation/i);
  assert.doesNotMatch(payments, /Payment request controls/);
});
