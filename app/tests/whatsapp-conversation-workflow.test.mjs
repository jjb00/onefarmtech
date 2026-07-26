import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("main inbox opens a conversation workspace", () => {
  const page = read("src/app/admin/buyer-messages/page.tsx");

  assert.match(page, /Open conversation/);
  assert.match(
    page,
    /\/admin\/buyer-messages\/\$\{message\.recordType\}\/\$\{message\.id\}/,
  );
});

test("conversation workspace supports reply buyer linking and orders", () => {
  const page = read(
    "src/app/admin/buyer-messages/[recordType]/[recordId]/page.tsx",
  );

  assert.match(page, /Reply on WhatsApp/);
  assert.match(page, /Link existing buyer/);
  assert.match(page, /Create new buyer/);
  assert.match(page, /Start order/);
  assert.match(page, /sendWhatsAppConversationReplyAction/);
  assert.match(page, /linkWhatsAppConversationBuyerAction/);
  assert.match(page, /createWhatsAppConversationBuyerAction/);
  assert.match(page, /startWhatsAppOrderFromConversationAction/);
});

test("conversation actions preserve duplicate protection and evidence", () => {
  const actions = read("src/actions/whatsappConversation.ts");

  assert.match(actions, /findCustomerByPhone/);
  assert.match(actions, /phone-already-linked/);
  assert.match(actions, /buyer-already-exists/);
  assert.match(actions, /sendWhatsAppTextMessage/);
  assert.match(actions, /WhatsApp inbound draft/);
  assert.match(actions, /Started order from WhatsApp conversation/);
  assert.match(actions, /Created buyer from WhatsApp conversation/);
});

test("legacy WhatsApp tools route returns to the main queue", () => {
  const page = read("src/app/admin/whatsapp-tools/page.tsx");
  assert.match(page, /redirect\("\/admin\/buyer-messages"\)/);
});
