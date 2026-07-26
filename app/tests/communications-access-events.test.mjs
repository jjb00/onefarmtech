import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
  communicationViewsForRole,
  resolveCommunicationViewForRole,
} from "../src/lib/communicationsWorkspace.js";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("legacy communication role policy remains least privilege", () => {
  assert.deepEqual(communicationViewsForRole("Finance"), ["reconciliation"]);
  assert.ok(communicationViewsForRole("Operations").includes("operations"));
  assert.equal(
    resolveCommunicationViewForRole("whatsapp", "Finance"),
    "reconciliation"
  );
  assert.equal(
    resolveCommunicationViewForRole("all", "Buyer account manager"),
    null
  );
});

test("reconciliation URLs remain protected without primary navigation exposure", async () => {
  const access = await read("src/lib/adminAccess.ts");
  const proxy = await read("src/proxy.ts");
  const navigation = await read("src/data/adminNavigation.ts");

  assert.match(access, /buyer-messages\?view=reconciliation/);
  assert.match(access, /URLSearchParams/);
  assert.match(
    proxy,
    /canAccessAdminPath\(claims\.role, `\$\{pathname\}\$\{search\}`\)/
  );
  assert.doesNotMatch(navigation, /buyer-messages\?view=reconciliation/);
  assert.doesNotMatch(navigation, /title: "Money"/);
});

test("reconciliation action retains independent finance protection", async () => {
  const actions = await read("src/actions/communications.ts");

  assert.match(actions, /requireCapability\("manage_payments"\)/);
});

test("operational events remain implemented outside routine navigation", async () => {
  const source = await read("src/lib/operationalEvents.ts");
  const navigation = await read("src/data/adminNavigation.ts");

  assert.match(source, /sanitizedMetadata/);
  assert.doesNotMatch(navigation, /Operational events/);
});

test("standalone enquiries retain the shared renderer", async () => {
  const standalone = await read("src/app/admin/contact-enquiries/page.tsx");
  const renderer = await read(
    "src/components/admin/ContactEnquiriesList.tsx"
  );

  assert.match(standalone, /ContactEnquiriesList/);
  assert.doesNotMatch(standalone, /prisma\.contactEnquiry/);
  assert.match(renderer, /prisma\.contactEnquiry\.findMany/);
  assert.match(renderer, /updateContactEnquiryStatusAction/);
});

test("specialist legacy tools remain reachable", async () => {
  const launch = await read("src/app/admin/launch-inbox/page.tsx");
  const drafts = await read("src/app/admin/whatsapp-drafts/page.tsx");
  const tools = await read("src/app/admin/whatsapp-tools/page.tsx");

  assert.match(launch, /convertBuyerAccountRequestToCustomerAction/);
  assert.match(launch, /updateOrderRequestStatusAction/);
  assert.match(drafts, /whatsapp-orders\/new\?draftId=/);
  assert.match(tools, /sendWhatsAppStorefrontMenuAction/);
  assert.match(tools, /sendWhatsAppProductListAction/);
});
