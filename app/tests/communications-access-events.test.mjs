import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {communicationViewsForRole, resolveCommunicationViewForRole} from "../src/lib/communicationsWorkspace.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("role view matrix is least privilege and invalid fallback is role safe", () => {
  assert.deepEqual(communicationViewsForRole("Finance"), ["reconciliation"]);
  assert.deepEqual(communicationViewsForRole("Support"), ["all", "whatsapp", "enquiries", "email", "operations"]);
  assert.ok(communicationViewsForRole("Operations").includes("operations"));
  assert.equal(resolveCommunicationViewForRole("whatsapp", "Finance"), "reconciliation");
  assert.equal(resolveCommunicationViewForRole("invalid", "Support"), "all");
  assert.equal(resolveCommunicationViewForRole("all", "Buyer account manager"), null);
});

test("direct URL and sidebar access use query-aware reconciliation rules", async () => {
  const access = await read("src/lib/adminAccess.ts");
  const proxy = await read("src/proxy.ts");
  const navigation = await read("src/data/adminNavigation.ts");
  assert.match(access, /buyer-messages\?view=reconciliation/);
  assert.match(access, /URLSearchParams/);
  assert.match(proxy, /canAccessAdminPath\(claims\.role, `\$\{pathname\}\$\{search\}`\)/);
  assert.doesNotMatch(navigation, /buyer-messages\?view=reconciliation/);
  assert.match(navigation, /title: "Money"/);
});

test("reconciliation action has independent role protection", async () => {
  const actions = await read("src/actions/communications.ts");
  assert.match(actions, /requireCapability\("manage_payments"\)/);
  assert.doesNotMatch(actions, /Support[\s\S]{0,80}manage_payments/);
});

test("Operational events is a paginated searchable filtered source view", async () => {
  const page = await read("src/app/admin/buyer-messages/page.tsx");
  assert.match(page, /view === "operations"/);
  assert.match(page, /prisma\.operationalEvent\.count\(\{where\}\)/);
  assert.match(page, /category.*severity.*relatedType.*pageSize/);
  assert.match(page, /orderBy: \[\{createdAt: "desc"\}, \{id: "desc"\}\]/);
  assert.match(page, /skip: \(page - 1\) \* pageSize, take: pageSize/);
  assert.match(page, /No matching operational events/);
  assert.match(page, /OperationalEventRow/);
  assert.match(page, /OperationalEventCard/);
  assert.match(page, /href: `\$\{PATH\}\?view=operations`/);
});

test("Operational event review exposes no metadata and invents no mutation", async () => {
  const page = await read("src/app/admin/buyer-messages/page.tsx");
  const review = page.slice(page.indexOf("function OperationalEventReview"), page.indexOf("async function ReconciliationView"));
  assert.doesNotMatch(review, /metadata/);
  assert.doesNotMatch(review, /<form/);
  const source = await read("src/lib/operationalEvents.ts");
  assert.match(source, /sanitizedMetadata/);
});

test("standalone and Inbox enquiries use one shared renderer", async () => {
  const standalone = await read("src/app/admin/contact-enquiries/page.tsx");
  const inbox = await read("src/app/admin/buyer-messages/page.tsx");
  const renderer = await read("src/components/admin/ContactEnquiriesList.tsx");
  assert.match(standalone, /ContactEnquiriesList/);
  assert.match(inbox, /ContactEnquiriesList/);
  assert.doesNotMatch(standalone, /prisma\.contactEnquiry/);
  assert.equal((renderer.match(/prisma\.contactEnquiry\.findMany/g) || []).length >= 1, true);
  assert.match(renderer, /updateContactEnquiryStatusAction/);
});

test("legacy pages and unique operational actions remain reachable", async () => {
  const launch = await read("src/app/admin/launch-inbox/page.tsx");
  const drafts = await read("src/app/admin/whatsapp-drafts/page.tsx");
  const tools = await read("src/app/admin/whatsapp-tools/page.tsx");
  for (const route of ["whatsapp", "whatsapp-inbox", "contact-enquiries", "launch-inbox", "whatsapp-drafts", "whatsapp-tools"]) await read(`src/app/admin/${route}/page.tsx`);
  assert.match(launch, /convertBuyerAccountRequestToCustomerAction/);
  assert.match(launch, /updateOrderRequestStatusAction/);
  assert.match(drafts, /whatsapp-orders\/new\?draftId=/);
  assert.match(tools, /sendWhatsAppStorefrontMenuAction/);
  assert.match(tools, /sendWhatsAppProductListAction/);
});

test("Launch inbox states queue ownership without changing mutations", async () => {
  const launch = await read("src/app/admin/launch-inbox/page.tsx");
  assert.match(launch, /Queue ownership:/);
  assert.match(launch, /buyer-messages\?view=enquiries/);
  assert.match(launch, /updateContactEnquiryStatusAction/);
});
