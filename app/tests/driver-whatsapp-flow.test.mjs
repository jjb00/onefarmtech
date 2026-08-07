import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("webhook routes an active delivery partner's phone to the driver flow before any buyer processing", () => {
  const webhook = read("src/app/api/whatsapp/webhook/route.ts");
  const driverCheckIndex = webhook.indexOf("prisma.deliveryPartner.findFirst");
  const buyerLogIndex = webhook.indexOf("logInboundMessage({");
  assert.ok(driverCheckIndex > -1, "driver lookup is present");
  assert.ok(buyerLogIndex > -1, "buyer inbound logging is present");
  assert.ok(driverCheckIndex < buyerLogIndex, "driver check runs before buyer inbound logging");
  assert.match(webhook, /status: "Active"/);
  assert.match(webhook, /handleDriverWhatsAppMessage/);
  assert.match(webhook, /if \(driver\) \{[\s\S]*continue;/);
});

test("driver status buttons match the web portal's own three-state vocabulary", () => {
  const jobsPage = read("src/app/delivery-partner/jobs/page.tsx");
  const flow = read("src/lib/whatsapp/driverFlow.ts");
  for (const status of ["Out for delivery", "Delivered", "Failed / issue"]) {
    assert.match(jobsPage, new RegExp(`<option>${status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</option>`));
  }
  assert.match(flow, /out: "Out for delivery"/);
  assert.match(flow, /delivered: "Delivered"/);
  assert.match(flow, /issue: "Failed \/ issue"/);
});

test("driver flow and the web portal form share one status-update implementation", () => {
  const flow = read("src/lib/whatsapp/driverFlow.ts");
  const actions = read("src/actions/createAdminRecords.ts");
  const deliveryStatus = read("src/lib/deliveryStatus.ts");
  assert.match(flow, /import \{applyDeliveryStatusUpdate, DeliveryStatusError/);
  assert.match(actions, /applyDeliveryStatusUpdate, DeliveryStatusError\} = await import\("@\/lib\/deliveryStatus"\)/);
  assert.match(deliveryStatus, /export async function applyDeliveryStatusUpdate/);
  // Ownership is enforced once, centrally -- a driver can only act on jobs
  // assigned to them, whichever channel they use.
  assert.match(deliveryStatus, /deliveryPartnerId: input\.partnerId/);
});

test("assigning or reassigning a driver notifies them by WhatsApp, not just the buyer", () => {
  const actions = read("src/actions/createAdminRecords.ts");
  const occurrences = actions.match(/notifyDriverOfNewJob/g) || [];
  // One import + one call per action (assignDeliveryPartnerAction and
  // createOrAssignDeliveryFromOrderAction) = 4 total.
  assert.equal(occurrences.length, 4);
  assert.match(actions, /if \(partner\?\.phone\) \{[\s\S]*notifyDriverOfNewJob/);
});

test("delivery partner phone numbers are normalized so the webhook's normalized sender can match them", () => {
  const actions = read("src/actions/createAdminRecords.ts");
  assert.match(actions, /normalizeInternationalPhone\(phoneInput, "234"\)/);
});

test("a driver's next free-text message after a status update is captured as a note, not misread as a new command", () => {
  const flow = read("src/lib/whatsapp/driverFlow.ts");
  assert.match(flow, /step: "AWAITING_NOTE"/);
  assert.match(flow, /whatsAppDriverSession\.upsert/);
  assert.match(flow, /session\.expiresAt > new Date\(\)/);
});
