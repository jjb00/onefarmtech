import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("daily admin navigation excludes recruitment, general enquiries and launch tools", () => {
  const navigation = read("src/data/adminNavigation.ts");

  assert.doesNotMatch(navigation, /career-applications/);
  assert.doesNotMatch(navigation, /contact-enquiries/);
  assert.doesNotMatch(navigation, /launch-inbox/);
  assert.match(navigation, /Today/);
  assert.match(navigation, /Orders/);
  assert.match(navigation, /WhatsApp/);
  assert.match(navigation, /Buyers/);
});

test("future careers and supplier submissions are email-first", () => {
  const actions = read("src/actions/publicApplications.ts");

  assert.doesNotMatch(actions, /careerApplication\.create/);
  assert.doesNotMatch(actions, /contactEnquiry\.create/);
  assert.match(actions, /EMAIL_CAREERS_RECIPIENTS|getOperationalEmailRecipients/);
  assert.match(actions, /attachments: \[cv\]/);
});

test("career application form requires a CV attachment", () => {
  const modal = read("src/components/CareerApplicationModal.tsx");

  assert.match(modal, /name="cv"/);
  assert.match(modal, /type="file"/);
  assert.doesNotMatch(modal, /encType=/);
  assert.match(modal, /Maximum 5MB/);
});

test("ordinary and WhatsApp customers are not labelled as pending account approval", () => {
  const relationship = read("src/lib/buyerRelationship.ts");
  const buyers = read("src/components/admin/BuyersList.tsx");

  assert.match(relationship, /No account requested/);
  assert.match(relationship, /Awaiting account review/);
  assert.match(relationship, /Login active/);
  assert.doesNotMatch(buyers, /Internal label:/);
  assert.match(buyers, /buyerRelationshipLabel/);
  assert.doesNotMatch(buyers, />Pending login approval</);
});

test("email delivery supports controlled attachments without storing them", () => {
  const service = read("src/lib/email/service.ts");

  assert.match(service, /type EmailAttachment/);
  assert.match(service, /attachments: input\.attachments/);
  assert.doesNotMatch(service, /attachmentBody|storedAttachment/);
});
