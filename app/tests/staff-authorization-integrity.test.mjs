import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("staff cannot select a role and login resolves an active database identity", async () => {
  const page = await read("src/app/login/page.tsx");
  const route = await read("src/app/api/staff-login/route.ts");
  const login = await read("src/lib/staffLogin.js");
  assert.doesNotMatch(page, /name="staffRole"|Role for this session|name="staffName"/);
  assert.match(login, /db\.staffUser\.findFirst/);
  assert.match(login, /staff\.status !== "Active"/);
  assert.match(route, /verifyStaffPassword/);
  assert.doesNotMatch(`${route}\n${login}`, /ADMIN_PASSWORD/);
});

test("signed claims bind staff id role revision and expiry", async () => {
  const session = await read("src/lib/staffAuthorization.ts");
  const current = await read("src/lib/currentStaff.ts");
  const proxy = await read("src/proxy.ts");
  for (const field of ["staffId", "role", "staffUpdatedAt", "expiresAt"]) assert.match(session, new RegExp(field));
  assert.match(session, /timingSafeEqual/);
  assert.match(current, /staff\.role === claims\?\.role/);
  assert.match(current, /staff\.updatedAt\.toISOString\(\) === claims\?\.staffUpdatedAt/);
  assert.match(proxy, /verifyStaffSessionToken/);
  assert.doesNotMatch(proxy, /oft_staff_role/);
});

test("capability matrix prevents role escalation", async () => {
  const permissions = await read("src/lib/permissions.ts");
  assert.match(permissions, /Support: \["manage_support", "manage_communications"\]/);
  assert.match(permissions, /Finance: \["manage_finance", "manage_payments"\]/);
  assert.match(permissions, /Operations: \["manage_orders", "manage_fulfilment"/);
  assert.match(permissions, /Admin: allCapabilities\.filter/);
  assert.match(permissions, /"manage_staff", "manage_admin_configuration"/);
});

test("sensitive actions enforce capabilities inside server actions", async () => {
  const admin = await read("src/actions/createAdminRecords.ts");
  const order = await read("src/actions/createOrder.ts");
  const operations = await read("src/actions/orderOperations.ts");
  assert.match(admin, /createStaffUserAction[\s\S]{0,100}requireCapability\("manage_staff"\)/);
  assert.match(admin, /generatePaymentLinkAction[\s\S]{0,100}requireCapability\("manage_payments"\)/);
  assert.match(admin, /generateDeliveryPartnerAccessCodeAction[\s\S]{0,120}requireCapability\("manage_delivery_access"\)/);
  assert.match(admin, /paymentStatus !== existingOrder\.paymentStatus[\s\S]{0,100}manage_payments/);
  assert.match(admin, /fulfilmentStatus !== existingOrder\.fulfilmentStatus[\s\S]{0,100}manage_fulfilment/);
  assert.match(order, /requireCapability\("manage_orders"\)/);
  assert.match(operations, /requireCapability\("manage_payments"\)/);
  assert.match(operations, /requireCapability\("manage_fulfilment"\)/);
});

test("unauthenticated actions reject and audit actors are authoritative", async () => {
  const auth = await read("src/lib/auth.ts");
  const audit = await read("src/lib/auditLog.ts");
  assert.match(auth, /if \(!staff\.isAuthenticated\) redirect\("\/staff-login"\)/);
  assert.match(audit, /currentStaff\.isAuthenticated \? currentStaff\.name/);
  assert.match(audit, /currentStaff\.isAuthenticated \? currentStaff\.email/);
  assert.match(audit, /currentStaff\.isAuthenticated \? currentStaff\.role/);
});
