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

test("Today shows only a bounded WhatsApp exception queue", async () => {
  const dashboard = await source("src/app/admin/page.tsx");

  assert.doesNotMatch(dashboard, /Production follow-up/);
  assert.doesNotMatch(dashboard, /failedEmailCount/);
  assert.match(dashboard, /WhatsApp exception/);
  assert.match(dashboard, /need a person/);
});

test("WhatsApp route is a narrow human-exception queue", async () => {
  const page = await source("src/app/admin/buyer-messages/page.tsx");

  assert.match(page, /WhatsApp exceptions/);
  assert.match(page, /Needs human attention/);
  assert.match(page, /Unknown contacts/);
  assert.match(page, /Mark handled/);
  assert.doesNotMatch(page, /CommunicationsViewSwitcher/);
  assert.doesNotMatch(page, /BuyerWhatsAppComposeButton/);
  assert.doesNotMatch(page, /All operational conversations/);
});

test("homepage uses temporary launch activity without exposing group-buy details", async () => {
  const homepage = await source("src/app/page.tsx");

  assert.match(homepage, /progress:\s*68/);
  assert.match(homepage, /activeGroupBuyCount:\s*4/);
  assert.match(homepage, /buyerPlaces:\s*32/);
  assert.match(homepage, /Launch activity/);
  assert.match(homepage, /Next window closes Friday/);
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
