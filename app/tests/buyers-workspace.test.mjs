import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {BUYER_VIEWS, buyerViewHref, buyerViewsForRole, resolveBuyerView, resolveBuyerViewForRole} from "../src/lib/buyersWorkspace.js";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("customers is the canonical role-aware Buyers workspace", async () => {
  assert.deepEqual(BUYER_VIEWS, ["all", "applications", "access", "updates"]);
  assert.equal(resolveBuyerView("bad"), "all");
  assert.equal(resolveBuyerViewForRole("access", "Operations"), "all");
  assert.ok(buyerViewsForRole("Buyer account manager").includes("access"));
  assert.equal(buyerViewsForRole("Finance").length, 0);
  assert.equal(buyerViewHref("all", {q: "farm", page: 9, pageSize: 50}), "/admin/customers?view=all&q=farm&pageSize=50");
  const page = await read("src/app/admin/customers/page.tsx");
  assert.match(page, /title="Buyers"/); assert.match(page, /BuyersViewSwitcher/); assert.match(page, /resolveBuyerViewForRole/);
});

test("All buyers combines account and guest identities in one paginated list", async () => {
  const list = await read("src/components/admin/BuyersList.tsx");
  assert.match(list, /WITH account_buyers AS/);
  assert.match(list, /guest_buyers AS/);
  assert.match(list, /UNION ALL/);
  assert.match(list, /customerId" IS NULL/);
  assert.match(list, /sourcePhone/);
  assert.match(list, /relationship: "Account buyer" \| "Guest buyer"/);
  assert.match(list, /COUNT\(\*\) OVER\(\)/);
  assert.match(list, /LIMIT \$5/);
  assert.match(list, /OFFSET \$6/);
  assert.match(list, /Open buyer/);
  assert.match(list, /View latest order/);
  assert.match(list, /md:hidden/);
});

test("legacy guest buyers route redirects into the unified Buyers list", async () => {
  const guests = await read("src/app/admin/guest-buyers/page.tsx");
  assert.match(guests, /redirect/);
  assert.match(guests, /customers\?view=all&relationship=Guest\+buyer/);
});

test("Applications reuses the scalable conversion-integrity queue", async () => {
  const workspace = await read("src/app/admin/customers/page.tsx"), applications = await read("src/app/admin/buyer-account-requests/page.tsx");
  assert.match(workspace, /BuyerAccountRequestsPage/); assert.match(applications, /convertBuyerAccountRequestToCustomerAction/); assert.match(applications, /skip: \(page - 1\) \* pageSize/); assert.match(applications, /customers\?view=applications/);
});

test("Access and update queues are server-paginated and preserve management actions", async () => {
  const access = await read("src/components/admin/BuyerAccessList.tsx");
  const accessRoute = await read("src/app/admin/buyer-access/page.tsx");
  const updates = await read("src/components/admin/BuyerUpdateRequestsList.tsx");

  assert.match(access, /prisma\.customer\.count/);
  assert.match(access, /skip: \(page - 1\) \* pageSize/);
  assert.match(access, /take: pageSize/);
  assert.match(access, /prisma\.buyerContact\.findMany/);
  assert.match(access, /prisma\.buyerAccountInvite\.findMany/);
  assert.match(access, /contactsByBuyer/);
  assert.match(access, /invitesByBuyer/);
  assert.match(access, /label="buyer accounts"/);
  assert.match(access, /Manage access/);

  assert.match(accessRoute, /createBuyerContactAction/);
  assert.match(accessRoute, /createBuyerAccountInviteAction/);
  assert.match(accessRoute, /updateBuyerAccountInviteStatusAction/);

  assert.match(updates, /buyerProfileUpdateRequest\.count/);
  assert.match(updates, /updateBuyerProfileUpdateRequestStatusAction/);
  assert.match(updates, /md:grid-cols/);
});

test("Buyer detail has bounded URL-driven operational sections", async () => {
  const detail = await read("src/app/admin/customers/[id]/page.tsx");
  for (const section of ["overview", "access", "orders", "finance", "communications", "activity"]) assert.match(detail, new RegExp(`"${section}"`));
  assert.match(detail, /aria-label="Buyer detail sections"/); assert.match(detail, /take: 25/); assert.match(detail, /updateCustomerAccountAction/);
});

test("legacy buyer routes remain and link to the canonical workspace", async () => {
  for (const route of ["buyer-accounts", "guest-buyers", "buyer-account-requests", "buyer-access", "buyer-profile-requests"]) { const source = await read(`src/app/admin/${route}/page.tsx`); assert.match(source, /customers\?view=/); }
});
