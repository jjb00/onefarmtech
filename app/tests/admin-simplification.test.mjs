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
  assert.match(navigation, /Payments/);
  assert.match(navigation, /Products/);
  assert.doesNotMatch(navigation, /title: "Settings"/);
  assert.doesNotMatch(navigation, /title: "Money"/);
});

test("profile menu is role-aware and sidebar state persists", () => {
  const chrome = read("src/components/admin/AdminLayoutFrame.tsx");
  const sidebar = read("src/components/admin/AdminSidebarGroup.tsx");
  assert.match(chrome, /Staff management/);
  assert.match(chrome, /staff\.role === "Super admin"/);
  assert.match(chrome, /\["Super admin", "Admin"\]\.includes\(staff\.role\)/);
  assert.match(sidebar, /localStorage\.setItem\(storageKey/);
  assert.match(chrome, /event\.key === "Escape"/);
  assert.match(chrome, /setMobileOpen\(false\)/);
});

test("Today is bounded and contains operational queues only", () => {
  const today = read("src/app/admin/page.tsx");
  assert.match(today, /const LIMIT = 8/);
  assert.match(today, /New order requests/);
  assert.match(today, /Payments to follow up/);
  assert.match(today, /Unknown WhatsApp order contacts/);
  assert.doesNotMatch(today, /Operational events|Email delivery|reconciliation/i);
  assert.match(today, /isOperationalUnknownWhatsAppContact/);
});

test("order and payment workspaces default to needs action with bounded pagination", () => {
  const orders = read("src/app/admin/orders/page.tsx");
  const payments = read("src/app/admin/payment-requests/page.tsx");
  assert.match(orders, /"needs-action"/);
  assert.match(orders, /parseAdminPageSize/);
  assert.match(orders, /skip: \(page - 1\) \* pageSize/);
  assert.match(orders, /take: pageSize/);
  assert.doesNotMatch(orders, /include:\s*\{\s*payments:/);
  assert.match(payments, /params\?\.view \|\| "needs-action"/);
  assert.match(payments, /parseAdminPageSize/);
  assert.match(payments, /take: pageSize/);
  assert.match(payments, /roleHasCapability\(staff\.role, "manage_payments"\)/);
});

test("recruitment WhatsApp is conservatively excluded from operational contacts", async () => {
  const {classifyUnknownWhatsAppContact, isOperationalUnknownWhatsAppContact} =
    await import("../src/lib/whatsappClassification.js");
  assert.equal(classifyUnknownWhatsAppContact({message: "I want to submit my CV for a job application"}), "recruitment");
  assert.equal(isOperationalUnknownWhatsAppContact({message: "I want to submit my CV for a job application"}), false);
  assert.equal(classifyUnknownWhatsAppContact({message: "Can I place an order for tomatoes?"}), "operational order contact");
  assert.equal(isOperationalUnknownWhatsAppContact({message: "Can I place an order for tomatoes?"}), true);
  assert.equal(classifyUnknownWhatsAppContact({message: "Hello"}), "unknown");
});

test("six primary areas provide accessible loading feedback", () => {
  for (const path of [
    "src/app/admin/loading.tsx",
    "src/app/admin/orders/loading.tsx",
    "src/app/admin/buyer-messages/loading.tsx",
    "src/app/admin/customers/loading.tsx",
    "src/app/admin/payment-requests/loading.tsx",
    "src/app/admin/products/loading.tsx",
  ]) assert.match(read(path), /AdminRouteLoading/);
  const loading = read("src/components/admin/AdminRouteLoading.tsx");
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /role="status"/);
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
