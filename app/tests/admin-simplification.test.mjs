import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("daily admin navigation contains only the approved primary areas", () => {
  const navigation = read("src/data/adminNavigation.ts");

  for (const title of ["Today", "Orders", "Buyers", "Payments", "Products"]) {
    assert.match(navigation, new RegExp(`title:\\s*"${title}"`));
  }

  assert.doesNotMatch(navigation, /title:\s*"WhatsApp"/);
  assert.doesNotMatch(navigation, /title:\s*"Money"/);
  assert.doesNotMatch(navigation, /title:\s*"Settings"/);
  assert.doesNotMatch(navigation, /career-applications/);
  assert.doesNotMatch(navigation, /contact-enquiries/);
  assert.doesNotMatch(navigation, /launch-inbox/);
});

test("profile menu remains role-aware and mobile-safe", () => {
  const chrome = read("src/components/admin/AdminLayoutFrame.tsx");

  assert.match(chrome, /Staff management/);
  assert.match(chrome, /staff\.role === "Super admin"/);
  assert.match(chrome, /\["Super admin", "Admin"\]\.includes\(staff\.role\)/);
  assert.match(chrome, /<details className="relative">/);
  assert.match(chrome, /<summary[^>]*>[\s\S]*Menu/);
  assert.match(chrome, /lg:hidden/);
});

test("Today contains actionable operational queues only", () => {
  const today = read("src/app/admin/page.tsx");

  for (const label of [
    "New order requests",
    "Orders needing action",
    "Payment follow-up",
    "Fulfilment",
    "Buyer applications",
    "Profile updates",
    "Open complaints",
    "Messages needing a reply",
  ]) {
    assert.match(today, new RegExp(label));
  }

  assert.doesNotMatch(
    today,
    /Operational events|Email delivery|reconciliation|Production follow-up/i
  );
});

test("orders and payments retain bounded pagination and operational controls", () => {
  const orders = read("src/app/admin/orders/page.tsx");
  const payments = read("src/app/admin/payment-requests/page.tsx");

  assert.match(orders, /"needs-action"/);
  assert.match(orders, /parseAdminPageSize/);
  assert.match(orders, /skip: \(page - 1\) \* pageSize/);
  assert.match(orders, /take: pageSize/);
  assert.doesNotMatch(orders, /include:\s*\{\s*payments:/);

  assert.match(payments, /prisma\.paymentRequest\.findMany/);
  assert.match(payments, /take: 200/);
  assert.match(payments, /AdminViewBar/);
  assert.match(payments, /generatePaymentLinkAction/);
  assert.match(payments, /verifyPaystackPaymentAction/);
  assert.match(payments, /verifyFlutterwavePaymentAction/);
});

test("recruitment WhatsApp is excluded from operational contacts", async () => {
  const {
    classifyUnknownWhatsAppContact,
    isOperationalUnknownWhatsAppContact,
  } = await import("../src/lib/whatsappClassification.js");

  assert.equal(
    classifyUnknownWhatsAppContact({
      message: "I want to submit my CV for a job application",
    }),
    "recruitment"
  );
  assert.equal(
    isOperationalUnknownWhatsAppContact({
      message: "I want to submit my CV for a job application",
    }),
    false
  );
  assert.equal(
    classifyUnknownWhatsAppContact({
      message: "Can I place an order for tomatoes?",
    }),
    "operational order contact"
  );
  assert.equal(
    isOperationalUnknownWhatsAppContact({
      message: "Can I place an order for tomatoes?",
    }),
    true
  );
});

test("primary admin shell remains responsive and accessible", () => {
  const chrome = read("src/components/admin/AdminLayoutFrame.tsx");
  const navigation = read("src/components/admin/AdminNavigationLink.tsx");
  const header = read("src/components/admin/AdminPageHeader.tsx");

  assert.match(chrome, /aria-label="Admin navigation"/);
  assert.match(chrome, /lg:hidden/);
  assert.match(chrome, /lg:grid-cols-/);
  assert.match(navigation, /aria-current/);
  assert.match(header, /<h1/);
});

test("future careers and supplier submissions remain email-first", () => {
  const actions = read("src/actions/publicApplications.ts");

  assert.doesNotMatch(actions, /careerApplication\.create/);
  assert.doesNotMatch(actions, /contactEnquiry\.create/);
  assert.match(
    actions,
    /EMAIL_CAREERS_RECIPIENTS|getOperationalEmailRecipients/
  );
  assert.match(actions, /attachments: \[cv\]/);
});

test("career application form requires a CV attachment", () => {
  const modal = read("src/components/CareerApplicationModal.tsx");

  assert.match(modal, /name="cv"/);
  assert.match(modal, /type="file"/);
  assert.match(modal, /Maximum 5MB/);
});

test("ordinary buyers are not labelled as awaiting account approval", () => {
  const relationship = read("src/lib/buyerRelationship.ts");
  const buyers = read("src/components/admin/BuyersList.tsx");

  assert.match(relationship, /No account requested/);
  assert.match(relationship, /Awaiting account review/);
  assert.match(relationship, /Login active/);
  assert.match(buyers, /buyerRelationshipLabel/);
  assert.doesNotMatch(buyers, />Pending login approval</);
});

test("email delivery supports attachments without storing them", () => {
  const service = read("src/lib/email/service.ts");

  assert.match(service, /type EmailAttachment/);
  assert.match(service, /attachments: input\.attachments/);
  assert.doesNotMatch(service, /attachmentBody|storedAttachment/);
});
