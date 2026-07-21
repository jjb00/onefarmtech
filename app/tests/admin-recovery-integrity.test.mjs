import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {ADMIN_RECOVERY_EMAIL, ADMIN_RECOVERY_ROLE, recoveryTokenMatches} from "../src/lib/adminRecovery.js";

const page = fs.readFileSync(new URL("../src/app/admin-recovery/page.tsx", import.meta.url), "utf8");
const route = fs.readFileSync(new URL("../src/app/api/admin-recovery/route.ts", import.meta.url), "utf8");
const proxy = fs.readFileSync(new URL("../src/proxy.ts", import.meta.url), "utf8");

test("recovery uses ordinary POST without a Server Action identifier", () => {
  assert.match(page, /action="\/api\/admin-recovery" method="post"/);
  assert.doesNotMatch(page, /use server|formAction|loginAction/);
  assert.match(route, /export async function POST/);
});

test("wrong recovery tokens are rejected", () => {
  assert.equal(recoveryTokenMatches("wrong", "correct"), false);
  assert.equal(recoveryTokenMatches("correct", "correct"), true);
  assert.match(route, /Rejected emergency admin recovery/);
});

test("only active Super Admin Grace is eligible", () => {
  assert.equal(ADMIN_RECOVERY_EMAIL, "grace@onefarmtech.com");
  assert.equal(ADMIN_RECOVERY_ROLE, "Super admin");
  assert.match(route, /staff\.status !== "Active"/);
  assert.match(route, /staff\.role !== ADMIN_RECOVERY_ROLE/);
});

test("correct recovery creates the authoritative signed staff session cookie", () => {
  for (const claim of ["staffId", "role", "staffUpdatedAt", "expiresAt", "version"]) assert.match(route, new RegExp(claim));
  assert.match(route, /createStaffSessionToken/);
  assert.match(route, /response\.cookies\.set\(STAFF_SESSION_COOKIE/);
  assert.match(route, /httpOnly: true/);
  assert.match(route, /secure: process\.env\.NODE_ENV === "production"/);
});

test("the recovery token is server-only and never written to audit metadata", () => {
  assert.match(route, /process\.env\.EMERGENCY_ADMIN_RECOVERY_TOKEN/);
  assert.doesNotMatch(page, /EMERGENCY_ADMIN_RECOVERY_TOKEN/);
  assert.match(route, /metadata: JSON\.stringify\(\{fingerprint\}\)/);
  assert.doesNotMatch(route, /metadata:.*submitted|metadata:.*configured/);
});

test("success redirects only to admin and recovery bypasses the normal admin guard", () => {
  assert.match(route, /new URL\("\/admin", request\.url\)/);
  assert.doesNotMatch(route, /formData\.get\("next"\)/);
  assert.match(proxy, /pathname !== "\/admin-recovery"/);
});
