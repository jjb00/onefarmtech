import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {authenticateStaffLogin} from "../src/lib/staffLogin.js";

const page = fs.readFileSync(new URL("../src/app/login/page.tsx", import.meta.url), "utf8");
const route = fs.readFileSync(new URL("../src/app/api/staff-login/route.ts", import.meta.url), "utf8");
const actions = fs.readFileSync(new URL("../src/actions/auth.ts", import.meta.url), "utf8");

const grace = {id: "staff-grace", name: "Grace", email: "grace@onefarmtech.com", role: "Super admin", status: "Active", updatedAt: new Date("2026-07-21T12:00:00Z")};
const dbFor = (staff) => ({staffUser: {findFirst: async () => staff}});

test("staff login HTML uses ordinary POST and contains no Server Action identifier", () => {
  assert.match(page, /action="\/api\/staff-login"/);
  assert.match(page, /method="post"/);
  assert.doesNotMatch(page, /loginAction|\$ACTION_ID_|formAction/);
  assert.doesNotMatch(actions, /export async function loginAction/);
});

test("ordinary POST authentication accepts active Grace with the correct password", async () => {
  const result = await authenticateStaffLogin({db: dbFor(grace), email: "GRACE@onefarmtech.com", password: "correct", verifyPassword: (_email, password) => password === "correct"});
  assert.equal(result?.id, grace.id); assert.equal(result?.role, "Super admin");
});

test("incorrect passwords and inactive staff are rejected", async () => {
  assert.equal(await authenticateStaffLogin({db: dbFor(grace), email: grace.email, password: "wrong", verifyPassword: () => false}), null);
  assert.equal(await authenticateStaffLogin({db: dbFor({...grace, status: "Inactive"}), email: grace.email, password: "correct", verifyPassword: () => true}), null);
});

test("route creates the existing signed session cookie with eight-hour expiry", () => {
  assert.match(route, /createStaffSessionToken/);
  for (const claim of ["staffId", "role", "staffUpdatedAt", "expiresAt", "version"]) assert.match(route, new RegExp(claim));
  assert.match(route, /response\.cookies\.set\(STAFF_SESSION_COOKIE/);
  assert.match(route, /maxAge: 60 \* 60 \* 8/);
});

test("success redirects only to admin and failures remain generic", () => {
  assert.match(route, /new URL\("\/admin", request\.url\)/);
  assert.match(route, /new URL\("\/staff-login\?error=1", request\.url\)/);
  assert.doesNotMatch(route, /formData\.get\("next"\)|ADMIN_PASSWORD/);
});

test("login is dynamic, audited and rate limited", () => {
  assert.match(page, /dynamic = "force-dynamic"/); assert.match(page, /revalidate = 0/);
  assert.match(route, /Rejected staff login/); assert.match(route, /Completed staff login/); assert.match(route, /STAFF_LOGIN_MAX_FAILURES/);
});
