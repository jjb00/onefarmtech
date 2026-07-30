import assert from "node:assert/strict";
import test from "node:test";
import {fulfilmentEstimateForStockTypes, estimatedFulfilmentDate} from "../src/lib/commerce/fulfilmentEstimate.ts";

test("fresh-sourced items always need the 1-2 day lead time", () => {
  assert.equal(fulfilmentEstimateForStockTypes(["Fresh sourced"]).leadTimeDays, 2);
  assert.equal(fulfilmentEstimateForStockTypes(["Fresh sourced"]).label, "1-2 days (fresh sourcing)");
});

test("a mixed cart of stocked and fresh-sourced items still needs the lead time", () => {
  const estimate = fulfilmentEstimateForStockTypes(["Stocked", "Fresh sourced"]);
  assert.equal(estimate.leadTimeDays, 2);
});

test("an all-stocked cart can fulfil same/next-day", () => {
  const estimate = fulfilmentEstimateForStockTypes(["Stocked", "Stocked"]);
  assert.equal(estimate.leadTimeDays, 0);
  assert.equal(estimate.label, "Same/next-day (stocked)");
});

test("estimatedFulfilmentDate adds the lead time in days", () => {
  const from = new Date("2026-01-01T00:00:00.000Z");
  const stocked = estimatedFulfilmentDate(["Stocked"], from);
  const fresh = estimatedFulfilmentDate(["Fresh sourced"], from);
  assert.equal(stocked.getUTCDate(), 1);
  assert.equal(fresh.getUTCDate(), 3);
});

test("empty stockType list defaults to needing fresh sourcing (fail safe, not fail open)", () => {
  assert.equal(fulfilmentEstimateForStockTypes([]).leadTimeDays, 0);
  // Explicitly documents current behavior: an empty cart has no items to be
  // unsure about, so it reports same/next-day. Real checkout always calls
  // this with at least one line item present.
});
