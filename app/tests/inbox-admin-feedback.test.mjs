import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Inbox separates intake sources and defaults incidents to unresolved", () => {
  const inbox = read("src/app/admin/buyer-messages/page.tsx");
  for (const label of ["Career applications", "Supplier enquiries", "Buyer requests", "Order requests"]) assert.match(inbox, new RegExp(label));
  assert.match(inbox, /status = value\(raw\.status\) \|\| "Open"/);
  assert.match(inbox, /operationalEvent\.findMany\(\{where: \{status: "Open"\}/);
});

test("dashboard attention metrics use today and unresolved states", () => {
  const dashboard = read("src/app/admin/page.tsx");
  assert.match(dashboard, /today\.setHours\(0, 0, 0, 0\)/); assert.match(dashboard, /Failed today/);
  assert.match(dashboard, /Unresolved payments/); assert.match(dashboard, /Needs attention/);
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
