import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("buyer access delivery is capability protected and supports email and WhatsApp", () => {
  const actions = read("src/actions/createAdminRecords.ts");

  assert.match(
    actions,
    /sendBuyerAccountInviteAction[\s\S]*requireCapability\("manage_buyer_access"\)/,
  );
  assert.match(actions, /channel === "email"/);
  assert.match(actions, /sendTransactionalEmail/);
  assert.match(actions, /sendWhatsAppBuyerInviteTemplate/);
  assert.match(actions, /normaliseWhatsAppPhone/);
});

test("WhatsApp buyer access delivery uses an approved configurable template", () => {
  const provider = read("src/lib/whatsapp/provider.ts");

  assert.match(provider, /sendWhatsAppBuyerInviteTemplate/);
  assert.match(provider, /WHATSAPP_BUYER_INVITE_TEMPLATE_NAME/);
  assert.match(provider, /WHATSAPP_BUYER_INVITE_TEMPLATE_LANGUAGE/);
  assert.match(provider, /type: "template"/);
  assert.match(provider, /input\.accessCode/);
  assert.match(provider, /input\.loginUrl/);
});

test("buyer access delivery records outcomes without exposing the access code in message logs", () => {
  const actions = read("src/actions/createAdminRecords.ts");

  assert.match(actions, /relatedType: "BuyerAccountInvite"/);
  assert.match(actions, /status: "Pending"/);
  assert.match(actions, /status: "Sent"/);
  assert.match(actions, /status: "Failed"/);
  assert.match(
    actions,
    /body: `A buyer access code was sent securely to \$\{normalizedRecipient\}\.`/,
  );
  assert.doesNotMatch(
    actions,
    /body:\s*`[^`]*\$\{invite\.inviteCode\}[^`]*`/,
  );
});

test("buyer access page exposes delivery feedback and channel-specific actions", () => {
  const page = read("src/app/admin/buyer-access/page.tsx");

  assert.match(page, /sendBuyerAccountInviteAction/);
  assert.match(page, /name="channel" value="email"/);
  assert.match(page, /name="channel" value="whatsapp"/);
  assert.match(page, /Send email/);
  assert.match(page, /Send WhatsApp/);
  assert.match(page, /deliveryMessages/);
  assert.match(page, /Copy manually/);
});

test("buyer access delivery controls disable duplicate submits and show clear pending labels", () => {
  const page = read("src/app/admin/buyer-access/page.tsx");
  const button = read("src/components/admin/PendingSubmitButton.tsx");

  assert.match(button, /useFormStatus/);
  assert.match(button, /const isDisabled = disabled \|\| pending/);
  assert.match(button, /disabled=\{isDisabled\}/);
  assert.match(button, /aria-disabled=\{isDisabled\}/);
  assert.match(button, /pending \? pendingLabel : label/);

  assert.match(page, /label="Generate access code"[\s\S]*pendingLabel="Generating…"/);
  assert.match(page, /label="Send email"[\s\S]*pendingLabel="Sending email…"/);
  assert.match(page, /label="Send WhatsApp"[\s\S]*pendingLabel="Sending WhatsApp…"/);
  assert.match(page, /label="Save"[\s\S]*pendingLabel="Saving…"/);
});

test("loading controls preserve cancelled-invite disabling and existing delivery forms", () => {
  const page = read("src/app/admin/buyer-access/page.tsx");

  assert.match(page, /disabled=\{invite\.status === "Cancelled"\}/);
  assert.match(page, /form action=\{sendBuyerAccountInviteAction\}/);
  assert.match(page, /form action=\{updateBuyerAccountInviteStatusAction\}/);
  assert.match(page, /form action=\{createBuyerAccountInviteAction\}/);
  assert.match(page, /canReveal \? invite\.inviteCode : maskSecret\(invite\.inviteCode\)/);
});
