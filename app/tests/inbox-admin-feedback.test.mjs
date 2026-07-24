import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("WhatsApp keeps only the five operational views in routine navigation", () => {
  const inbox = read("src/app/admin/buyer-messages/page.tsx");
  const switcher = read("src/components/admin/CommunicationsViewSwitcher.tsx");

  assert.doesNotMatch(inbox, /Career applications/);
  assert.doesNotMatch(inbox, /Supplier enquiries/);
  for (const label of ["Needs reply", "Known buyers", "Unknown order contacts", "Failed operational messages", "All operational conversations"]) assert.match(switcher, new RegExp(label));
  assert.doesNotMatch(switcher, /Email delivery|Reconciliation|Operational events/);
  assert.match(inbox, /isOperationalUnknownWhatsAppContact/);
});

test("Today uses bounded unresolved operational queues", () => {
  const dashboard = read("src/app/admin/page.tsx");
  assert.match(dashboard, /const LIMIT = 8/);
  assert.match(dashboard, /Payments to follow up/);
  assert.match(dashboard, /Open customer complaints/);
});

test("staff deactivation remains guarded and now requires confirmation", () => {
  const page = read("src/app/admin/staff/page.tsx"), rules = read("src/lib/staffAccountManagement.js");
  assert.match(page, /ConfirmSubmitButton/); assert.match(page, /Last updated/); assert.match(page, /rolePermissions/);
  assert.match(rules, /selfDeactivate/); assert.match(rules, /lastSuperAdmin/);
});

test("changed admin actions use the shared visible feedback banner", () => {
  const banner = read("src/components/admin/AdminActionFeedback.tsx"), staff = read("src/app/admin/staff/page.tsx");
  assert.match(banner, /validation/); assert.match(banner, /forbidden/); assert.match(banner, /provider/); assert.match(banner, /database/); assert.match(banner, /retry/);
  assert.match(staff, /AdminActionFeedback/);
});
