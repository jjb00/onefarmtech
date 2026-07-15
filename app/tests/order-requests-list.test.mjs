import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {adminListHref, adminResultRange, parseAdminPageSize} from "../src/lib/adminListParams.js";

const page = fs.readFileSync(new URL("../src/app/admin/order-requests/page.tsx", import.meta.url), "utf8");

test("Order requests reuses validated shared pagination", () => {
  assert.equal(parseAdminPageSize(), 25); for (const size of [25, 50, 100]) assert.equal(parseAdminPageSize(size), size); assert.equal(parseAdminPageSize(75), 25);
  assert.deepEqual(adminResultRange(2, 25, 61), {start: 26, end: 50});
  const href = adminListHref("/admin/order-requests", {q: "tomato", status: "New", source: "Order request page", type: "Restaurant", conversion: "not-converted", pageSize: 50}, {page: 2});
  for (const key of ["q=tomato", "status=New", "source=Order+request+page", "type=Restaurant", "conversion=not-converted", "pageSize=50", "page=2"]) assert.equal(href.includes(key), true);
});

test("Order requests applies database search, filtering and stable page queries", () => {
  assert.match(page, /skip: \(page - 1\) \* pageSize, take: pageSize/); assert.match(page, /orderBy: \[\{createdAt: "desc"\}, \{id: "desc"\}\]/); assert.match(page, /orderRequest\.count\(\{where\}\)/);
  for (const field of ["buyerName", "phone", "email", "location", "items", "message", "adminNote"]) assert.match(page, new RegExp(`"${field}"`));
  for (const filter of ["status", "source", "buyerType", "conversion"]) assert.match(page, new RegExp(filter));
  assert.match(page, /redirect\(adminListHref/);
});

test("Order requests retains safe actions, conversion evidence and edge states", () => {
  assert.match(page, /updateOrderRequestStatusAction/); assert.match(page, /\/admin\/whatsapp-orders\/new\?draftId=/); assert.match(page, /convertedOrderId/); assert.match(page, /Marked converted; no resulting order link is stored/); assert.match(page, /!converted \?/); assert.match(page, /No matching order requests/); assert.match(page, /compactHeader/); assert.match(page, /md:hidden/);
  for (const route of ["launch-inbox", "whatsapp-drafts", "drafts", "whatsapp-orders/new"]) assert.equal(fs.existsSync(new URL(`../src/app/admin/${route}/page.tsx`, import.meta.url)), true);
});

test("Order requests uses the Phase 2 shared list foundation", () => {
  for (const component of ["AdminListToolbar", "AdminResultCount", "AdminPagination", "AdminEmptyState"]) assert.match(page, new RegExp(component));
});
