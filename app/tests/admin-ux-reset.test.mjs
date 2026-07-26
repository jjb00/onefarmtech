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

test("orders use four primary views and protect confirmed orders from destructive controls", () => {
  const source = read("src/app/admin/orders/page.tsx");

  for (const label of [
    "Needs action",
    "New requests",
    "In fulfilment",
    "Completed",
  ]) {
    assert.match(source, new RegExp(label));
  }

  assert.doesNotMatch(source, /Awaiting payment|All orders|Delete permanently/);

  const confirmedOrdersSection = source.slice(
    source.indexOf('const orders = await prisma.order.findMany'),
    source.indexOf('async function NewRequestsView'),
  );

  assert.doesNotMatch(confirmedOrdersSection, /AdminRecordControls/);

  const requestSection = source.slice(
    source.indexOf('async function NewRequestsView'),
  );

  assert.match(requestSection, /AdminRecordControls/);
  assert.match(requestSection, /recordType="OrderRequest"/);
  assert.match(requestSection, /canDelete=\{staff\.role === "Super admin"\}|canDelete/);
});

test("buyer, payment and message pages avoid internal planning language", () => {
  const guest = read("src/app/admin/guest-buyers/page.tsx");
  const messages = read("src/app/admin/buyer-messages/page.tsx");
  const payments = read("src/app/admin/payment-requests/page.tsx");
  assert.doesNotMatch(guest, /Guest intelligence|bounded recent view/i);
  assert.doesNotMatch(messages, /WhatsApp exceptions|Routine automation/i);
  assert.doesNotMatch(payments, /Payment request controls/);
});
