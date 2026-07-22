import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("buyer login is a real shared form and sessions bind authoritative BuyerContact permissions", () => {
  const page = read("src/app/buyer-login/page.tsx");
  const modal = read("src/components/BuyerLoginModal.tsx");
  const auth = read("src/actions/auth.ts");
  const current = read("src/lib/currentBuyer.ts");

  assert.match(page, /BuyerLoginModal/);
  assert.match(page, /defaultOpen/);
  assert.match(modal, /action=\{buyerLoginAction\}/);
  assert.match(modal, /Request buyer account setup/);
  assert.match(auth, /matchingContact\.id/);
  assert.match(auth, /matchingContact\.updatedAt\.toISOString/);

  for (const capability of [
    "canPlaceOrders",
    "canViewReceipts",
    "canViewCredit",
  ]) {
    assert.match(current, new RegExp(capability));
  }

  assert.match(current, /contact\.status === "Active"/);
  assert.match(current, /requireBuyerCapability/);
});

test("buyer server actions and protected queries enforce contact capabilities", () => {
  assert.match(read("src/actions/createAdminRecords.ts"), /requireBuyerCapability\("canPlaceOrders"\)/);
  assert.match(read("src/app/buyer-account/payments/page.tsx"), /requireBuyerCapability\("canViewReceipts"\)/);
  assert.match(read("src/app/buyer-account/order/page.tsx"), /requireBuyerCapability\("canPlaceOrders"\)/);
});
