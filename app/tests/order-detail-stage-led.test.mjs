import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const detail = fs.readFileSync(
  new URL("../src/app/admin/orders/[id]/page.tsx", import.meta.url),
  "utf8",
);

test("order detail leads with current stage and one recommended action", () => {
  assert.match(detail, /Current stage/);
  assert.match(detail, /Next action/);
  assert.match(detail, /nextStepTitle/);
  assert.match(detail, /nextStepDescription/);
  assert.match(detail, /orderStage/);
  assert.match(detail, /nextFulfilmentStatus/);
});

test("secondary controls are retained under More details", () => {
  assert.match(detail, /More details/);
  assert.match(detail, /Buyer, items, payments, delivery, messages and notes/);
  assert.match(detail, /linkOrderToCustomerAction/);
  assert.match(detail, /createPaymentRequestFromOrderAction/);
  assert.match(detail, /createOrAssignDeliveryFromOrderAction/);
  assert.match(detail, /logOrderBuyerMessageAction/);
  assert.match(detail, /WhatsApp templates/);
  assert.match(detail, /Buyer message log for this order/);
});

test("stage panel supports payment and fulfilment progression", () => {
  assert.match(detail, /Create payment request/);
  assert.match(detail, /Create payment link/);
  assert.match(detail, /Send payment request/);
  assert.match(detail, /Move to \{nextFulfilmentStatus\}/);
  assert.match(detail, /updateAdminOrderControlAction/);
});

test("duplicate legacy order-control panels are removed", () => {
  assert.doesNotMatch(detail, /WhatsApp sales handoff/);
  assert.doesNotMatch(detail, /Operational checklist/);
  assert.doesNotMatch(detail, /Complete the post-payment workflow/);
  assert.doesNotMatch(detail, /operationalChecklist/);

  const deliveryForms =
    detail.match(/action=\{createOrAssignDeliveryFromOrderAction\}/g) || [];

  assert.equal(deliveryForms.length, 1);
});
