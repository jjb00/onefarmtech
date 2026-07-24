import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {adminListHref, adminResultRange, parseAdminPageSize} from "../src/lib/adminListParams.js";

const page = fs.readFileSync(new URL("../src/app/admin/buyer-account-requests/page.tsx", import.meta.url), "utf8");

test("Buyer applications reuse shared paging and preserve filters", () => {
  assert.equal(parseAdminPageSize(), 25); for (const size of [25, 50, 100]) assert.equal(parseAdminPageSize(size), size); assert.equal(parseAdminPageSize(30), 25); assert.deepEqual(adminResultRange(3, 25, 62), {start: 51, end: 62});
  const href = adminListHref("/admin/buyer-account-requests", {q: "market", status: "New", source: "Buyer account request page", type: "Business buyer", conversion: "not-converted", pageSize: 50}, {page: 2});
  for (const key of ["q=market", "status=New", "source=Buyer+account+request+page", "type=Business+buyer", "conversion=not-converted", "pageSize=50", "page=2"]) assert.equal(href.includes(key), true);
});

test("Buyer applications use database search, filters and stable pagination", () => {
  assert.match(page, /skip: \(page - 1\) \* pageSize, take: pageSize/); assert.match(page, /orderBy: \[\{createdAt: "desc"\}, \{id: "desc"\}\]/); assert.match(page, /buyerAccountRequest\.count\(\{where\}\)/);
  for (const field of ["contactName", "organisationName", "email", "phone", "location", "businessRegNumber", "usualProduceNeeds", "message", "adminNote"]) assert.match(page, new RegExp(`"${field}"`));
  for (const filter of ["status", "source", "buyerType", "conversion"]) assert.match(page, new RegExp(filter)); assert.match(page, /redirect\(adminListHref/);
});

test("Buyer conversion remains evidenced, one-way in UI, and separate from access", () => {
  assert.match(page, /convertBuyerAccountRequestToCustomerAction/); assert.match(page, /updateBuyerAccountRequestStatusAction/); assert.match(page, /Converted to customer record:/); assert.match(page, /\/admin\/customers\/\$\{customer\.id\}/); assert.match(page, /Marked converted; no customer link stored/); assert.match(page, /!converted \?/); assert.match(page, /Configure login access separately/); assert.match(page, /\/admin\/buyer-access/);
});

test("Buyer applications retain edge states, responsive UI and shared components", () => {
  for (const component of ["AdminListToolbar", "AdminResultCount", "AdminPagination", "AdminEmptyState"]) assert.match(page, new RegExp(component));
  assert.match(page, /No account requests yet/); assert.match(page, /No matching account requests/); assert.match(page, /compactHeader/); assert.match(page, /md:hidden/); assert.match(page, /Review \{request\.contactName/);
  for (const route of ["launch-inbox", "customers", "buyer-access", "buyer-profile-requests"]) assert.equal(fs.existsSync(new URL(`../src/app/admin/${route}/page.tsx`, import.meta.url)), true);
});
