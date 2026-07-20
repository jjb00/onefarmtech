import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {honeypotIsFilled, intakeFingerprint, registerUniqueIntakeDedupe, validTurnstileResult, verifyThenReserveIntake} from "../src/lib/publicIntakeRules.js";

test("duplicate intake attempt does not create a second record", async () => {
  const keys = new Set(); let creates = 0;
  const rows = new Map();
  const db = {publicIntakeDedupe: {
    findUnique: async ({where}) => rows.get(where.dedupeKey) || null,
    deleteMany: async ({where}) => {if (rows.get(where.dedupeKey)?.createdAt < where.createdAt.lt) {rows.delete(where.dedupeKey); keys.delete(where.dedupeKey);}},
    create: async ({data}) => {if (keys.has(data.dedupeKey)) {const error = new Error("duplicate"); error.code = "P2002"; throw error;} keys.add(data.dedupeKey); rows.set(data.dedupeKey, {...data, createdAt: new Date()}); creates += 1;},
  }};
  const dedupeKey = `contact:${intakeFingerprint(["A", "a@example.com", "Hello"])}`;
  const since = new Date(Date.now() - 10 * 60 * 1000);
  assert.equal(await registerUniqueIntakeDedupe(db, dedupeKey, since), true);
  assert.equal(await registerUniqueIntakeDedupe(db, dedupeKey, since), false);
  assert.equal(creates, 1);
});

test("concurrent duplicate reservations allow exactly one submission", async () => {
  let row = null;
  const db = {publicIntakeDedupe: {
    findUnique: async () => null,
    deleteMany: async () => {},
    create: async ({data}) => {if (row) throw Object.assign(new Error("duplicate"), {code: "P2002"}); row = {...data, createdAt: new Date()};},
  }};
  const results = await Promise.all([registerUniqueIntakeDedupe(db, "same", new Date(0)), registerUniqueIntakeDedupe(db, "same", new Date(0))]);
  assert.deepEqual(results.sort(), [false, true]);
});

test("Turnstile requires success, hostname and action", () => {
  assert.equal(validTurnstileResult(null, "contact", "onefarmtech.com"), false);
  assert.equal(validTurnstileResult({success: false, action: "contact", hostname: "onefarmtech.com"}, "contact", "onefarmtech.com"), false);
  assert.equal(validTurnstileResult({success: true, action: "wrong", hostname: "onefarmtech.com"}, "contact", "onefarmtech.com"), false);
  assert.equal(validTurnstileResult({success: true, action: "contact", hostname: "evil.example"}, "contact", "onefarmtech.com"), false);
  assert.equal(validTurnstileResult({success: true, action: "contact", hostname: "onefarmtech.com"}, "contact", "onefarmtech.com"), true);
  assert.equal(validTurnstileResult({success: true, action: "contact", hostname: "www.onefarmtech.com"}, "contact", ["onefarmtech.com", "www.onefarmtech.com"]), true);
});

test("failed verification creates no dedupe reservation", async () => {
  let reservations = 0;
  await assert.rejects(() => verifyThenReserveIntake(async () => {throw new Error("expired token");}, async () => {reservations += 1; return true;}));
  assert.equal(reservations, 0);
});

test("honeypot rejects abusive submissions", () => {
  assert.equal(honeypotIsFilled("bot website"), true);
  assert.equal(honeypotIsFilled(""), false);
});

test("public actions protect before persistence and email", () => {
  const actions = fs.readFileSync(new URL("../src/actions/createAdminRecords.ts", import.meta.url), "utf8");
  for (const [start, createPattern] of [["createContactEnquiryAction", "contactEnquiry.create"], ["createOrderRequestAction", "orderRequest.create"]]) {
    const branch = actions.slice(actions.indexOf(`export async function ${start}`), actions.indexOf("export async function", actions.indexOf(`export async function ${start}`) + 25));
    assert.ok(branch.indexOf("protectPublicIntake") > -1);
    assert.ok(branch.indexOf("protectPublicIntake") < branch.indexOf(createPattern));
    assert.ok(branch.indexOf("protectPublicIntake") < branch.indexOf("sendTransactionalEmail"));
  }
  const buyer = actions.slice(actions.indexOf("export async function createBuyerAccountRequestAction"), actions.indexOf("export async function", actions.indexOf("export async function createBuyerAccountRequestAction") + 25));
  assert.doesNotMatch(buyer, /protectPublicIntake/);
});

test("Turnstile widgets, server verification and production-safe bypass are wired", () => {
  const order = fs.readFileSync(new URL("../src/app/order-request/page.tsx", import.meta.url), "utf8");
  const contact = fs.readFileSync(new URL("../src/app/contact/page.tsx", import.meta.url), "utf8");
  const protection = fs.readFileSync(new URL("../src/lib/publicIntakeProtection.ts", import.meta.url), "utf8");
  const widget = fs.readFileSync(new URL("../src/components/TurnstileWidget.tsx", import.meta.url), "utf8");
  for (const page of [order, contact]) {assert.match(page, /TurnstileWidget/); assert.match(page, /name="website"/);}
  assert.match(protection, /turnstile\/v0\/siteverify/);
  assert.match(protection, /validTurnstileResult\(result, action, allowedHostnames\)/);
  assert.match(protection, /NODE_ENV === "test" && process\.env\.TURNSTILE_TEST_BYPASS === "true"/);
  assert.match(widget, /callback: \(nextToken: string\) => setToken\(nextToken\)/);
  assert.match(widget, /name="cf-turnstile-response" value=\{token\}/);
  assert.match(widget, /expired-callback.*setToken\(""\)/s);
  assert.match(widget, /timeout-callback.*setToken\(""\)/s);
  assert.match(widget, /useFormStatus/);
  assert.match(widget, /disabled=\{!ready \|\| pending\}/);
  assert.match(widget, /pending \? pendingLabel : idleLabel/);
  assert.match(widget, /turnstile\.remove/);
  assert.match(contact, /pendingLabel="Sending…"/);
  assert.match(order, /pendingLabel="Submitting…"/);
  assert.match(contact, /key=\{intakeError \|\| "ready"\}/);
  assert.match(order, /key=\{intakeError \|\| "ready"\}/);
  assert.match(contact, /Your enquiry has been received/);
  assert.match(order, /Your order request has been received/);
});

test("both server actions read the exact explicit Turnstile token field", () => {
  const actions = fs.readFileSync(new URL("../src/actions/createAdminRecords.ts", import.meta.url), "utf8");
  for (const action of ["createContactEnquiryAction", "createOrderRequestAction"]) {
    const start = actions.indexOf(`export async function ${action}`);
    const end = actions.indexOf("export async function", start + 25);
    assert.match(actions.slice(start, end), /readText\(formData, "cf-turnstile-response"\)/);
  }
});

test("minimal protection has no rate limiting or admin spam workflow", () => {
  const protection = fs.readFileSync(new URL("../src/lib/publicIntakeProtection.ts", import.meta.url), "utf8");
  const actions = fs.readFileSync(new URL("../src/actions/createAdminRecords.ts", import.meta.url), "utf8");
  assert.doesNotMatch(protection, /x-forwarded-for|rate-limited|ipHash/);
  assert.doesNotMatch(actions, /manageIntakeSpamAction/);
});

test("homepage survives transient database activity failures", () => {
  const home = fs.readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  assert.match(home, /try \{/);
  assert.match(home, /Homepage activity unavailable/);
  assert.match(home, /activeGroupBuy: null, activeGroupBuyCount: 0/);
});
