import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {adminListHref, adminResultRange, parseAdminPage, parseAdminPageSize} from "../src/lib/adminListParams.js";

test("admin list pagination validates page sizes and pages", () => {
  assert.equal(parseAdminPageSize(undefined), 25);
  for (const size of [25, 50, 100]) assert.equal(parseAdminPageSize(String(size)), size);
  for (const size of [0, 10, 101, "bad"]) assert.equal(parseAdminPageSize(size), 25);
  assert.equal(parseAdminPage("3"), 3); assert.equal(parseAdminPage("-1"), 1);
});

test("admin list result ranges are accurate", () => {
  assert.deepEqual(adminResultRange(1, 25, 243), {start: 1, end: 25});
  assert.deepEqual(adminResultRange(10, 25, 243), {start: 226, end: 243});
  assert.deepEqual(adminResultRange(1, 25, 0), {start: 0, end: 0});
});

test("pagination links preserve filters and reset page when overridden", () => {
  const href = adminListHref("/admin/contact-enquiries", {q: "farm", status: "New", type: "Order support", source: "Contact page", pageSize: 50}, {page: 2});
  for (const value of ["q=farm", "status=New", "type=Order+support", "source=Contact+page", "pageSize=50", "page=2"]) assert.equal(href.includes(value), true);
  assert.doesNotMatch(adminListHref("/admin/contact-enquiries", {q: "farm", page: 8}, {page: 1}), /page=/);
});

test("Contact enquiries uses database pagination, search and filters", () => {
  const page = fs.readFileSync(new URL("../src/app/admin/contact-enquiries/page.tsx", import.meta.url), "utf8");
  const renderer = fs.readFileSync(new URL("../src/components/admin/ContactEnquiriesList.tsx", import.meta.url), "utf8");
  assert.match(page, /ContactEnquiriesList/);
  assert.match(renderer, /skip: \(page - 1\) \* pageSize, take: pageSize/);
  assert.match(renderer, /contactEnquiry\.count\(\{where\}\)/);
  for (const field of ["name", "email", "phone", "organisation", "message"]) assert.match(renderer, new RegExp(`"${field}"`));
  for (const filter of ["status", "enquiryType", "source"]) assert.match(renderer, new RegExp(filter));
  assert.match(renderer, /orderBy: \[\{createdAt: "desc"\}, \{id: "desc"\}\]/);
  assert.match(renderer, /redirect\(adminListHref/);
  assert.match(renderer, /updateContactEnquiryStatusAction/);
  assert.match(page, /compactHeader/);
  assert.match(renderer, /md:hidden/);
});

test("shared list components remain record-agnostic and include empty states", () => {
  const controls = fs.readFileSync(new URL("../src/components/admin/AdminListControls.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(controls, /ContactEnquiry|contactEnquiry/);
  assert.match(controls, /AdminEmptyState/);
  assert.match(controls, /Previous/); assert.match(controls, /Next/);
  assert.match(controls, /aria-label="List pagination"/);
});
