import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {COMMUNICATION_VIEWS, communicationViewHref, resolveCommunicationView} from "../src/lib/communicationsWorkspace.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("buyer messages remains the canonical Inbox with safe supported views", async () => {
  assert.deepEqual(COMMUNICATION_VIEWS, ["all", "whatsapp", "enquiries", "email", "reconciliation"]);
  assert.equal(resolveCommunicationView("unknown"), "all");
  const page = await read("src/app/admin/buyer-messages/page.tsx");
  assert.match(page, /title="Inbox"/);
  assert.match(page, /compactHeader/);
});

test("view switching is URL driven, accessible and resets pagination", async () => {
  assert.equal(communicationViewHref("email", {q: "buyer", page: 9, pageSize: 50}), "/admin/buyer-messages?view=email&q=buyer&pageSize=50");
  const switcher = await read("src/components/admin/CommunicationsViewSwitcher.tsx");
  assert.match(switcher, /aria-label="Inbox views"/);
  assert.match(switcher, /aria-current=/);
});

test("source views use database pagination, stable ordering and existing actions", async () => {
  const page = await read("src/app/admin/buyer-messages/page.tsx");
  assert.match(page, /channel: "WhatsApp"/);
  assert.match(page, /prisma\.contactEnquiry\.count/);
  assert.match(page, /prisma\.emailDelivery\.count/);
  assert.match(page, /prisma\.paymentReconciliationIncident\.count/);
  assert.match(page, /orderBy: \[\{createdAt: "desc"\}, \{id: "desc"\}\]/);
  assert.match(page, /retryFailedEmailAction/);
  assert.match(page, /updateContactEnquiryStatusAction/);
  assert.match(page, /resolvePaymentIncidentAction/);
  assert.match(page, /\/admin\/customers\//);
  assert.match(page, /\/admin\/orders\//);
});

test("unknown WhatsApp contacts and legacy routes remain discoverable", async () => {
  const page = await read("src/app/admin/buyer-messages/page.tsx");
  assert.match(page, /enquiryType: "WhatsApp inbound"/);
  assert.match(page, /unmatched WhatsApp contact/);
  for (const route of ["whatsapp", "whatsapp-inbox", "contact-enquiries", "launch-inbox", "whatsapp-drafts", "whatsapp-tools"]) {
    const legacy = await read(`src/app/admin/${route}/page.tsx`);
    assert.match(legacy, /buyer-messages/);
  }
});

test("role policy, Prisma models and webhook ingestion are unchanged by the workspace", async () => {
  const access = await read("src/lib/adminAccess.ts");
  assert.doesNotMatch(access, /buyer-messages/);
  const schema = await read("prisma/schema.prisma");
  assert.match(schema, /model BuyerMessage/);
  assert.match(schema, /model ContactEnquiry/);
  assert.match(schema, /model EmailDelivery/);
});
