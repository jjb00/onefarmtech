import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("message workspace contains only unresolved staff-attention queues", () => {
  const messages = read("src/app/admin/buyer-messages/page.tsx");

  assert.match(messages, /Messages needing a reply/);
  assert.match(messages, /Needs reply/);
  assert.doesNotMatch(messages, />\s*Unknown contacts\s*</);
  assert.match(messages, /buyerName: "Unknown buyer"/);
  assert.match(messages, /Mark handled/);
  assert.match(
    messages,
    /const CLOSED_BUYER_STATUSES = \["Replied", "Closed", "Resolved", "Archived"\]/,
  );
  assert.match(
    messages,
    /notIn: \["Unread", \.\.\.CLOSED_BUYER_STATUSES\]/,
  );
  assert.doesNotMatch(messages, /Buyer requests/);
  assert.doesNotMatch(messages, /Email delivery/);
  assert.doesNotMatch(messages, /Operational events/);
  assert.doesNotMatch(messages, /CommunicationsViewSwitcher/);
});

test("Today reports unresolved work rather than historical activity", () => {
  const dashboard = read("src/app/admin/page.tsx");

  assert.match(dashboard, /New order requests/);
  assert.match(dashboard, /Orders needing action/);
  assert.match(dashboard, /Payment follow-up/);
  assert.match(dashboard, /Buyer applications/);
  assert.match(dashboard, /Messages needing a reply/);

  assert.match(
    dashboard,
    /status: \{notIn: \["Replied", "Closed", "Resolved", "Archived"\]\}/
  );
  assert.match(
    dashboard,
    /status: \{notIn: \["Resolved", "Closed"\]\}/
  );

  assert.doesNotMatch(dashboard, /today\.setHours/);
  assert.doesNotMatch(dashboard, /Email delivery/);
  assert.doesNotMatch(dashboard, /Operational events/);
});

test("admin page shell preserves titles, descriptions and actions", () => {
  const shell = read("src/components/AdminPageShell.tsx");
  const layout = read("src/components/admin/AdminLayoutFrame.tsx");
  const header = read("src/components/admin/AdminPageHeader.tsx");

  assert.match(shell, /AdminLayoutFrame/);
  assert.match(shell, /title=\{title\}/);
  assert.match(shell, /description=\{description\}/);
  assert.match(shell, /action=\{action\}/);
  assert.match(layout, /AdminPageHeader/);
  assert.match(header, /description/);
});
