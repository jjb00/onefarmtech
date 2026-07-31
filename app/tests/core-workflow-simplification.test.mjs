import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("routine admin navigation no longer contains a WhatsApp workspace", async () => {
  const navigation = await source("src/data/adminNavigation.ts");

  assert.doesNotMatch(navigation, /title:\s*"WhatsApp"/);
  assert.doesNotMatch(navigation, /title:\s*"Open inbox"/);
  for (const title of ["Today", "Orders", "Buyers", "Payments", "Products"]) {
    assert.match(navigation, new RegExp(`title:\\s*"${title}"`));
  }
});

test("Today shows only messages requiring staff attention", async () => {
  const dashboard = await source("src/app/admin/page.tsx");

  assert.doesNotMatch(dashboard, /Production follow-up/);
  assert.doesNotMatch(dashboard, /failedEmailCount/);
  assert.match(dashboard, /Messages needing a reply/);
  assert.match(dashboard, /Work that needs attention/);
});

test("WhatsApp route shows only messages requiring staff attention", async () => {
  const page = await source("src/app/admin/buyer-messages/page.tsx");

  assert.match(page, /Messages needing a reply/);
  assert.match(page, /Needs reply/);
  assert.doesNotMatch(page, />\s*Unknown contacts\s*</);
  assert.match(page, /'Unknown buyer'::text AS "buyerName"/);
  assert.match(page, /Mark handled/);
  assert.doesNotMatch(page, /CommunicationsViewSwitcher/);
  assert.doesNotMatch(page, /BuyerWhatsAppComposeButton/);
  assert.doesNotMatch(page, /All operational conversations/);
});

test("homepage shows real group-buy activity, never fabricated numbers, without exposing details", async () => {
  const homepage = await source("src/app/page.tsx");

  // The card used to fall back to hardcoded fake numbers (68% progress, 4
  // groups, 32 places, "closes Friday") whenever there was no real paid
  // activity yet -- misleading a first-time visitor into thinking buyers
  // were already active. It must show honest real-or-empty state instead.
  assert.doesNotMatch(homepage, /progress:\s*68/);
  assert.doesNotMatch(homepage, /activeGroupBuyCount:\s*4/);
  assert.doesNotMatch(homepage, /buyerPlaces:\s*32/);
  assert.doesNotMatch(homepage, /Next window closes Friday/);
  assert.doesNotMatch(homepage, /launchMode/);

  assert.match(homepage, /Start the first group buy/);
  assert.match(homepage, /Join group buying/);
  assert.doesNotMatch(homepage, /activity\.activeGroupBuy\?\.title/);
  assert.doesNotMatch(homepage, /activity\.item/);
});

test("group-buy progress is recalculated from paid reservations", async () => {
  const actions = await source("src/actions/groupBuys.ts");

  assert.match(actions, /syncGroupBuyState/);
  assert.match(actions, /paidGroupBuyQuantity/);
  assert.doesNotMatch(actions, /reservedQuantity:\s*\{\s*increment/);
  assert.match(actions, /updateGroupBuyReservationAction/);
});
