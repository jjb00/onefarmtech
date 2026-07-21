import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("readiness requires configuration rather than code presence alone", () => {
  const readiness = read("scripts/provider-readiness.mjs"), checks = read("src/lib/prelaunchChecks.ts");
  assert.match(readiness, /missing required values/); assert.doesNotMatch(readiness, /ADMIN_PASSWORD/);
  assert.match(checks, /Paystack and Flutterwave credentials are configured/); assert.match(checks, /Public bot protection/);
});
