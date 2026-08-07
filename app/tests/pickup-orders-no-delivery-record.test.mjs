import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("neither order-creation path creates a Delivery record for pickup orders", () => {
  const botCheckout = read("src/lib/whatsapp/interactiveOrdering.ts");
  const adminOrder = read("src/actions/createAdminRecords.ts");

  assert.match(botCheckout, /import \{initialFulfilmentStatus, isPickupMethod\} from "@\/lib\/orderStatusRules\.js"/);
  assert.match(botCheckout, /if \(!isPickupMethod\(delivery\.method\)\) \{[\s\S]{0,80}await prisma\.delivery\.create/);

  assert.match(adminOrder, /if \(!isPickupMethod\(deliveryMethod\)\) \{[\s\S]{0,120}await prisma\.delivery\.create/);
});

test("the WhatsApp order-status reply never shows a Delivery line for a pickup order, even with stale data", () => {
  const statusReply = read("src/lib/whatsapp/statusReply.ts");
  assert.match(statusReply, /import \{isPickupMethod\} from "@\/lib\/orderStatusRules\.js"/);
  assert.match(statusReply, /if \(order\.delivery && !isPickupMethod\(order\.deliveryMethod\)\)/);
});
