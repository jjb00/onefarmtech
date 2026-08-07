import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Umami is tracked via the function-override form so its default context (hostname, screen, language, referrer) is merged in, not replaced", () => {
  const source = read("src/components/UmamiAnalytics.tsx");
  // A raw object argument replaces Umami's default context entirely instead
  // of merging with it, which silently drops "hostname" -- required by
  // data-domains domain verification -- and the collector rejects every
  // event with no client-visible error. Only the function form merges.
  assert.match(source, /window\.umami\?\.track\(\(props\) => \(\{ \.\.\.props, website: WEBSITE_ID, url: pathname \}\)\)/);
  assert.doesNotMatch(source, /window\.umami\?\.track\(\{\s*website:/);
});

test("Umami tracks every real public page, not a stale subset", () => {
  const source = read("src/components/UmamiAnalytics.tsx");
  for (const path of ["/impact", "/group-buy-request", "/buyer-login", "/partner-login"]) {
    assert.match(source, new RegExp(`"${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
});
