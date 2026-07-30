import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("chatbot uses persistent phone-based conversation state", () => {
  const schema = read("prisma/schema.prisma");
  const chatbot = read("src/lib/whatsapp/chatbot.ts");

  assert.match(schema, /model WhatsAppChatbotSession/);
  assert.match(schema, /phone\s+String\s+@unique/);
  assert.match(schema, /lastInboundMessageId\s+String\?\s+@unique/);
  assert.match(chatbot, /AWAIT_PRODUCT/);
  assert.match(chatbot, /AWAIT_QUANTITY/);
  assert.match(chatbot, /AWAIT_FULFILMENT/);
  assert.match(chatbot, /AWAIT_LOCATION/);
  assert.match(chatbot, /AWAIT_CONFIRMATION/);
  assert.match(chatbot, /STAFF_REVIEW/);
});

test("vague buying messages begin guidance and cannot create an order", () => {
  const chatbot = read("src/lib/whatsapp/chatbot.ts");

  assert.match(chatbot, /matchesOrderIntent/);
  assert.match(chatbot, /return beginProductSelection\(input\)/);
  assert.doesNotMatch(chatbot, /prisma\.order\.create/);
  assert.doesNotMatch(chatbot, /paymentStatus:\s*"Paid"/);
  assert.doesNotMatch(chatbot, /fulfilmentStatus:\s*"Fulfilled"/);
});

test("confirmed chatbot flow creates staff-review request only", () => {
  const chatbot = read("src/lib/whatsapp/chatbot.ts");

  assert.match(chatbot, /prisma\.orderRequest\.create/);
  assert.match(chatbot, /source:\s*"WhatsApp chatbot"/);
  assert.match(chatbot, /requiresStaffReview:\s*true/);
  assert.match(chatbot, /requiresFinalTotalConfirmation:\s*true/);
  assert.match(chatbot, /paymentNotRequested:\s*true/);
  assert.match(chatbot, /fulfilmentNotStarted:\s*true/);
  assert.match(chatbot, /No payment or fulfilment has started yet/);
});

test("confirmation is valid only at the confirmation step", () => {
  const chatbot = read("src/lib/whatsapp/chatbot.ts");

  assert.match(
    chatbot,
    /if \(currentStep === "AWAIT_CONFIRMATION"\)/,
  );
  assert.match(
    chatbot,
    /!\["yes", "confirm", "confirmed"\]\.includes\(text\)/,
  );
});

test("catalogue payment and delivery answers query live records", () => {
  const chatbot = read("src/lib/whatsapp/chatbot.ts");

  assert.match(chatbot, /prisma\.product\.findMany/);
  assert.match(chatbot, /basePrice/);
  assert.match(chatbot, /availability/);
  assert.match(chatbot, /prisma\.order\.findFirst/);
  assert.match(chatbot, /paymentStatus/);
  assert.match(chatbot, /fulfilmentStatus/);
  assert.match(chatbot, /trackingReference/);
});

test("webhook uses interactive ordering before legacy draft creation", () => {
  // Superseded by the interactive (buttons/lists) ordering flow — see
  // whatsapp-interactive-ordering.test.mjs. chatbot.ts and
  // WhatsAppChatbotSession are kept only so July 27's historical
  // conversation records still render in the admin panel; the webhook no
  // longer routes live messages through them.
  const webhook = read("src/app/api/whatsapp/webhook/route.ts");

  assert.match(webhook, /handleInteractiveOrderingMessage/);
  assert.match(webhook, /if \(!interactiveOrderingHandled\)/);
  assert.doesNotMatch(webhook, /handleWhatsAppChatbotMessage/);

  const interactiveOrderingPosition = webhook.indexOf(
    "handleInteractiveOrderingMessage",
  );
  const legacyDraftPosition = webhook.lastIndexOf(
    "createDraftOrderRequestFromInboundWhatsApp",
  );

  assert.ok(interactiveOrderingPosition >= 0);
  assert.ok(legacyDraftPosition > interactiveOrderingPosition);
});
