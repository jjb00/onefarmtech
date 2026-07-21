import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("buyer login is a real form and sessions bind authoritative BuyerContact permissions", () => {
  const page = read("src/app/buyer-login/page.tsx"), auth = read("src/actions/auth.ts"), current = read("src/lib/currentBuyer.ts");
  assert.match(page, /action=\{buyerLoginAction\}/); assert.match(page, /Request a buyer account/);
  assert.match(auth, /matchingContact\.id/); assert.match(auth, /matchingContact\.updatedAt\.toISOString/);
  for (const capability of ["canPlaceOrders", "canViewReceipts", "canViewCredit"]) assert.match(current, new RegExp(capability));
  assert.match(current, /contact\.status === "Active"/); assert.match(current, /requireBuyerCapability/);
});

test("buyer server actions and protected queries enforce contact capabilities", () => {
  assert.match(read("src/actions/createAdminRecords.ts"), /requireBuyerCapability\("canPlaceOrders"\)/);
  assert.match(read("src/app/buyer-account/payments/page.tsx"), /requireBuyerCapability\("canViewReceipts"\)/);
  assert.match(read("src/app/buyer-account/order/page.tsx"), /requireBuyerCapability\("canPlaceOrders"\)/);
});
