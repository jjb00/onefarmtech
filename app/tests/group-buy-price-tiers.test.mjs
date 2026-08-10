import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  resolveGroupBuyTierPrice,
  tierRefundDue,
  MAX_CONCURRENT_GROUP_BUYS,
  LIVE_GROUP_BUY_STATUSES,
} from "../src/lib/groupBuyState.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("no tiers configured means flat pricing applies -- resolveGroupBuyTierPrice returns null", () => {
  assert.equal(resolveGroupBuyTierPrice([], 50), null);
});

test("the active tier is the highest threshold actually reached, not the highest tier that exists", () => {
  const tiers = [
    {minQuantity: 0, unitPrice: 80000},
    {minQuantity: 10, unitPrice: 75000},
    {minQuantity: 20, unitPrice: 70000},
  ];

  assert.equal(resolveGroupBuyTierPrice(tiers, 0), 80000);
  assert.equal(resolveGroupBuyTierPrice(tiers, 9), 80000);
  assert.equal(resolveGroupBuyTierPrice(tiers, 10), 75000);
  assert.equal(resolveGroupBuyTierPrice(tiers, 19), 75000);
  assert.equal(resolveGroupBuyTierPrice(tiers, 20), 70000);
  assert.equal(resolveGroupBuyTierPrice(tiers, 500), 70000);
});

test("tier resolution doesn't depend on the tiers being given in order", () => {
  const shuffled = [
    {minQuantity: 20, unitPrice: 70000},
    {minQuantity: 0, unitPrice: 80000},
    {minQuantity: 10, unitPrice: 75000},
  ];
  assert.equal(resolveGroupBuyTierPrice(shuffled, 15), 75000);
});

test("everyone settles at the best tier reached -- refund is owed when an early joiner paid more than the final tier", () => {
  // Buyer joined when the tier was 80k/bag for 5 bags; the group grew to
  // 20 bags by close, unlocking 70k/bag. They should get the 10k/bag
  // difference back, not the early joiner keeping the worse price.
  assert.equal(tierRefundDue(80000, 70000, 5), 50000);

  // No refund owed if the final tier never improved on what they paid.
  assert.equal(tierRefundDue(80000, 80000, 5), 0);

  // Never a negative refund even if called with an inverted/bad input.
  assert.equal(tierRefundDue(70000, 80000, 5), 0);
});

test("a soft cap on concurrent live group buys is enforced when opening a new one", () => {
  const actions = read("src/actions/groupBuys.ts");
  assert.match(actions, /LIVE_GROUP_BUY_STATUSES\.includes\(status\)/);
  assert.match(actions, /liveCount >= MAX_CONCURRENT_GROUP_BUYS/);
  assert.ok(MAX_CONCURRENT_GROUP_BUYS > 0 && MAX_CONCURRENT_GROUP_BUYS < 20, "cap is a small, sane number");
  assert.deepEqual(LIVE_GROUP_BUY_STATUSES, ["Open", "Minimum met", "Fully reserved"]);
});

test("staff can add and remove price tiers, and the admin view shows the currently active tier", () => {
  const actions = read("src/actions/groupBuys.ts");
  const adminPage = read("src/app/admin/group-buys/page.tsx");

  assert.match(actions, /export async function addGroupBuyPriceTierAction/);
  assert.match(actions, /export async function deleteGroupBuyPriceTierAction/);
  assert.match(actions, /prisma\.groupBuyPriceTier\.create/);
  assert.match(actions, /prisma\.groupBuyPriceTier\.delete/);

  assert.match(adminPage, /resolveGroupBuyTierPrice\(groupBuy\.priceTiers, groupBuy\.reservedQuantity\)/);
  assert.match(adminPage, /Everyone in this group buy settles at the best tier reached by close/);
});
