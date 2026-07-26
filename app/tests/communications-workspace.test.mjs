import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("buyer messages is a narrow staff-attention queue", async () => {
  const page = await read("src/app/admin/buyer-messages/page.tsx");

  assert.match(page, /title="Messages needing a reply"/);
  assert.match(page, /Needs reply/);
  assert.match(page, /Unknown contacts/);
  assert.match(page, /compactHeader/);

  assert.doesNotMatch(page, /CommunicationsViewSwitcher/);
  assert.doesNotMatch(page, /title="Inbox"/);
  assert.doesNotMatch(page, /view === "operations"/);
  assert.doesNotMatch(page, /view === "email"/);
  assert.doesNotMatch(page, /view === "reconciliation"/);
});

test("message queue uses server pagination and unresolved status filters", async () => {
  const page = await read("src/app/admin/buyer-messages/page.tsx");

  assert.match(page, /prisma\.buyerMessage\.count\(\{where\}\)/);
  assert.match(page, /skip: \(page - 1\) \* pageSize/);
  assert.match(page, /take: pageSize/);
  assert.match(page, /notIn: \["Replied", "Closed", "Resolved", "Archived"\]/);
  assert.match(page, /orderBy: \[\{createdAt: "asc"\}, \{id: "asc"\}\]/);
  assert.match(page, /Mark handled/);
});

test("unknown operational WhatsApp contacts remain available", async () => {
  const page = await read("src/app/admin/buyer-messages/page.tsx");

  assert.match(page, /enquiryType: "WhatsApp inbound"/);
  assert.match(page, /classification: operational/);
  assert.match(page, /nonOperationalWhatsAppPhrases/);
  assert.match(page, /Open WhatsApp/);
});

test("legacy communication routes remain present", async () => {
  for (const route of [
    "whatsapp",
    "whatsapp-inbox",
    "contact-enquiries",
    "launch-inbox",
    "whatsapp-drafts",
    "whatsapp-tools",
  ]) {
    await read(`src/app/admin/${route}/page.tsx`);
  }
});

test("communication data models and access rules remain present", async () => {
  const access = await read("src/lib/adminAccess.ts");
  const schema = await read("prisma/schema.prisma");

  assert.match(access, /buyer-messages/);
  assert.match(schema, /model BuyerMessage/);
  assert.match(schema, /model ContactEnquiry/);
  assert.match(schema, /model EmailDelivery/);
});
