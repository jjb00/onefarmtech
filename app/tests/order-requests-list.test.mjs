import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  adminListHref,
  adminResultRange,
  parseAdminPageSize,
} from "../src/lib/adminListParams.js";

const orders = fs.readFileSync(
  new URL("../src/app/admin/orders/page.tsx", import.meta.url),
  "utf8",
);

const legacy = fs.readFileSync(
  new URL("../src/app/admin/order-requests/page.tsx", import.meta.url),
  "utf8",
);

const actions = fs.readFileSync(
  new URL("../src/actions/createAdminRecords.ts", import.meta.url),
  "utf8",
);

test("New requests uses validated pagination inside canonical Orders", () => {
  assert.equal(parseAdminPageSize(), 25);

  for (const size of [25, 50, 100]) {
    assert.equal(parseAdminPageSize(size), size);
  }

  assert.equal(parseAdminPageSize(75), 25);
  assert.deepEqual(adminResultRange(2, 25, 61), {
    start: 26,
    end: 50,
  });

  const href = adminListHref(
    "/admin/orders",
    {
      view: "new-requests",
      q: "tomato",
      pageSize: 50,
    },
    {page: 2},
  );

  for (const key of [
    "view=new-requests",
    "q=tomato",
    "pageSize=50",
    "page=2",
  ]) {
    assert.equal(href.includes(key), true);
  }
});

test("Orders contains the complete inline request review workflow", () => {
  assert.match(orders, /NewRequestsView/);
  assert.match(orders, /prisma\.orderRequest\.count/);
  assert.match(orders, /prisma\.orderRequest\.findMany/);
  assert.match(orders, /status: \{in: \["New", "Reviewing"\]\}/);
  assert.match(orders, /Accept and create order/);
  assert.match(orders, /Mark under review/);
  assert.match(orders, /Reject/);
  assert.match(orders, /AdminRecordControls/);
  assert.match(orders, /recordType="OrderRequest"/);
  assert.match(orders, /returnTo=\{returnTo\}/);
  assert.match(orders, /Converted to order/);
  assert.doesNotMatch(orders, /\/admin\/order-requests\?focus=/);
  assert.doesNotMatch(orders, /Open Launch inbox/);
  assert.doesNotMatch(orders, /View WhatsApp drafts/);
});

test("all request sources use the integrity conversion action", () => {
  assert.match(orders, /updateOrderRequestStatusAction/);
  assert.match(actions, /convertOrderRequestIntegrity/);
  assert.match(
    actions,
    /\/admin\/orders\?view=new-requests&conversionError=/,
  );
  assert.match(
    actions,
    /redirect\(`\/admin\/orders\/\$\{convertedOrderId\}`\)/,
  );
});

test("legacy Order requests route redirects to canonical Orders", () => {
  assert.match(legacy, /redirect/);
  assert.match(legacy, /\/admin\/orders\?view=new-requests/);
});
